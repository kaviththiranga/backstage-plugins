import {
  EntityProvider,
  EntityProviderConnection,
} from '@backstage/plugin-catalog-node';
import { Entity } from '@backstage/catalog-model';
import { SchedulerServiceTaskRunner } from '@backstage/backend-plugin-api';
import { Config } from '@backstage/config';
import { LoggerService } from '@backstage/backend-plugin-api';
import {
  createThunderUserClient,
  createThunderGroupClient,
  type UserAPI,
  type GroupAPI,
} from '@openchoreo/backstage-plugin-thunder-idp-client-node';
import { ThunderTokenService } from '../auth';

type ThunderUser = UserAPI.components['schemas']['User'];
type ThunderGroup = GroupAPI.components['schemas']['Group'];
type ThunderUserListResponse =
  UserAPI.components['schemas']['UserListResponse'];
type ThunderGroupListResponse =
  GroupAPI.components['schemas']['GroupListResponse'];

/**
 * Configuration options for ThunderUserGroupEntityProvider
 */
export interface ThunderUserGroupEntityProviderOptions {
  taskRunner: SchedulerServiceTaskRunner;
  logger: LoggerService;
  config: Config;
  tokenService: ThunderTokenService;
}

/**
 * Provides User and Group entities from Thunder IdP API to Backstage Catalog
 */
export class ThunderUserGroupEntityProvider implements EntityProvider {
  private readonly taskRunner: SchedulerServiceTaskRunner;
  private connection?: EntityProviderConnection;
  private readonly logger: LoggerService;
  private readonly tokenService: ThunderTokenService;
  private readonly baseUrl: string;
  private readonly defaultNamespace: string;

  constructor(options: ThunderUserGroupEntityProviderOptions) {
    this.taskRunner = options.taskRunner;
    this.logger = options.logger;
    this.tokenService = options.tokenService;

    // Read Thunder configuration
    this.baseUrl = options.config.getString('thunder.baseUrl');

    // Default namespace for entities - configurable via app-config.yaml
    this.defaultNamespace =
      options.config.getOptionalString('thunder.defaultNamespace') || 'default';

    // Log authentication status
    if (this.tokenService.hasServiceCredentials()) {
      this.logger.info(
        'ThunderUserGroupEntityProvider initialized with service account authentication',
      );
    } else {
      this.logger.warn(
        'ThunderUserGroupEntityProvider: No service account configured. ' +
          'Thunder admin APIs require the system scope. Configure thunder.auth.* settings.',
      );
    }
  }

  getProviderName(): string {
    return 'ThunderUserGroupEntityProvider';
  }

  async connect(connection: EntityProviderConnection): Promise<void> {
    this.connection = connection;
    await this.taskRunner.run({
      id: this.getProviderName(),
      fn: async () => {
        await this.run();
      },
    });
  }

  async run(): Promise<void> {
    if (!this.connection) {
      throw new Error('Connection not initialized');
    }

    try {
      this.logger.info('Fetching users and groups from Thunder IdP API');

      // Get authentication token - prefer dynamic token service, fall back to static token
      const token = await this.getAuthToken();

      // Create API clients with the current token
      const { userClient, groupClient } = this.createClients(token);

      const allEntities: Entity[] = [];

      // Fetch all users
      const users = await this.fetchAllUsers(userClient);
      this.logger.debug(`Found ${users.length} users from Thunder IdP`);

      // Fetch all groups
      const groups = await this.fetchAllGroups(groupClient);
      this.logger.debug(`Found ${groups.length} groups from Thunder IdP`);

      // Transform users to Backstage User entities
      const userEntities = users.map(user => this.transformUserToEntity(user));
      allEntities.push(...userEntities);

      // Transform groups to Backstage Group entities
      const groupEntities = groups.map(group =>
        this.transformGroupToEntity(group),
      );
      allEntities.push(...groupEntities);

      // Apply full mutation - this replaces all entities managed by this provider
      await this.connection.applyMutation({
        type: 'full',
        entities: allEntities.map(entity => ({
          entity,
          locationKey: `provider:${this.getProviderName()}`,
        })),
      });

      this.logger.info(
        `Successfully processed ${allEntities.length} entities (${userEntities.length} users, ${groupEntities.length} groups)`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to run ThunderUserGroupEntityProvider: ${error}`,
      );
    }
  }

  /**
   * Gets the authentication token for Thunder API requests.
   */
  private async getAuthToken(): Promise<string | undefined> {
    if (!this.tokenService.hasServiceCredentials()) {
      this.logger.warn('No service account credentials configured');
      return undefined;
    }

    try {
      const token = await this.tokenService.getServiceToken();
      this.logger.debug('Obtained service account token');
      return token;
    } catch (error) {
      this.logger.error('Failed to get service account token', error as Error);
      throw error;
    }
  }

  /**
   * Creates Thunder API clients with the given token.
   */
  private createClients(token?: string) {
    const userClient = createThunderUserClient({
      baseUrl: this.baseUrl,
      token,
      logger: this.logger,
    });

    const groupClient = createThunderGroupClient({
      baseUrl: this.baseUrl,
      token,
      logger: this.logger,
    });

    return { userClient, groupClient };
  }

  /**
   * Fetches all users from Thunder IdP API with pagination
   */
  private async fetchAllUsers(
    userClient: ReturnType<typeof createThunderUserClient>,
  ): Promise<ThunderUser[]> {
    const allUsers: ThunderUser[] = [];
    let offset = 0;
    const limit = 100; // Fetch 100 users per request
    let hasMore = true;

    do {
      const { data, error } = await userClient.GET('/users', {
        params: {
          query: {
            limit,
            offset,
          },
        },
      });

      if (error) {
        this.logger.error(`Failed to fetch users: ${JSON.stringify(error)}`);
        break;
      }

      const response = data as ThunderUserListResponse;
      const users = response.users || [];

      if (users.length === 0) {
        hasMore = false;
        break;
      }

      allUsers.push(...users);

      // Check if we've fetched all users
      if (
        users.length < limit ||
        (response.totalResults && allUsers.length >= response.totalResults)
      ) {
        hasMore = false;
      } else {
        offset += limit;
      }
    } while (hasMore);

    return allUsers;
  }

  /**
   * Fetches all groups from Thunder IdP API with pagination
   */
  private async fetchAllGroups(
    groupClient: ReturnType<typeof createThunderGroupClient>,
  ): Promise<ThunderGroup[]> {
    const allGroups: ThunderGroup[] = [];
    let offset = 0;
    const limit = 100; // Fetch 100 groups per request
    let hasMore = true;

    do {
      const { data, error } = await groupClient.GET('/groups', {
        params: {
          query: {
            limit,
            offset,
          },
        },
      });

      if (error) {
        this.logger.error(`Failed to fetch groups: ${JSON.stringify(error)}`);
        break;
      }

      const response = data as ThunderGroupListResponse;
      const groups = response.groups || [];

      if (groups.length === 0) {
        hasMore = false;
        break;
      }

      allGroups.push(...groups);

      // Check if we've fetched all groups
      if (
        groups.length < limit ||
        (response.totalResults && allGroups.length >= response.totalResults)
      ) {
        hasMore = false;
      } else {
        offset += limit;
      }
    } while (hasMore);

    return allGroups;
  }

  /**
   * Transforms a Thunder User to a Backstage User entity
   */
  private transformUserToEntity(user: ThunderUser): Entity {
    const attributes = user.attributes || {};

    // Extract common user attributes
    const username = (attributes.username as string) || user.id;
    const email = attributes.email as string | undefined;
    const firstName = attributes.firstname as string | undefined;
    const lastName = attributes.lastname as string | undefined;

    // Construct display name
    let displayName = username;
    if (firstName && lastName) {
      displayName = `${firstName} ${lastName}`;
    } else if (firstName) {
      displayName = firstName;
    }

    const userEntity: Entity = {
      apiVersion: 'backstage.io/v1alpha1',
      kind: 'User',
      metadata: {
        name: this.sanitizeName(username),
        title: displayName,
        description: `User from Thunder IdP (${user.type || 'unknown'})`,
        namespace: this.defaultNamespace,
        annotations: {
          'backstage.io/managed-by-location': `provider:${this.getProviderName()}`,
          'backstage.io/managed-by-origin-location': `provider:${this.getProviderName()}`,
          'thunder.io/user-id': user.id,
          ...(user.organizationUnit && {
            'thunder.io/organization-unit': user.organizationUnit,
          }),
          ...(user.type && { 'thunder.io/user-type': user.type }),
        },
        labels: {
          'thunder.io/managed': 'true',
        },
      },
      spec: {
        profile: {
          displayName,
          ...(email && { email }),
        },
        memberOf: [], // Will be populated based on group membership if needed
      },
    };

    return userEntity;
  }

  /**
   * Transforms a Thunder Group to a Backstage Group entity
   */
  private transformGroupToEntity(group: ThunderGroup): Entity {
    const groupEntity: Entity = {
      apiVersion: 'backstage.io/v1alpha1',
      kind: 'Group',
      metadata: {
        name: this.sanitizeName(group.name),
        title: group.name,
        description: group.description || `Group from Thunder IdP`,
        namespace: this.defaultNamespace,
        annotations: {
          'backstage.io/managed-by-location': `provider:${this.getProviderName()}`,
          'backstage.io/managed-by-origin-location': `provider:${this.getProviderName()}`,
          'thunder.io/group-id': group.id,
          'thunder.io/organization-unit-id': group.organizationUnitId,
        },
        labels: {
          'thunder.io/managed': 'true',
        },
      },
      spec: {
        type: 'team',
        profile: {
          displayName: group.name,
          ...(group.description && { description: group.description }),
        },
        children: [], // Could be populated based on group hierarchy if needed
        members: this.extractMemberUsernames(group),
      },
    };

    return groupEntity;
  }

  /**
   * Extracts member usernames from a Thunder Group
   */
  private extractMemberUsernames(group: ThunderGroup): string[] {
    if (!group.members) {
      return [];
    }

    // Filter only user members (not group members) and sanitize their IDs
    return group.members
      .filter(
        (member: GroupAPI.components['schemas']['Member']) =>
          member.type === 'user',
      )
      .map((member: GroupAPI.components['schemas']['Member']) =>
        this.sanitizeName(member.id),
      );
  }

  /**
   * Sanitizes a name to be Backstage-compliant
   * Backstage entity names must be lowercase and contain only alphanumeric characters, hyphens, and underscores
   */
  private sanitizeName(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9-_]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }
}
