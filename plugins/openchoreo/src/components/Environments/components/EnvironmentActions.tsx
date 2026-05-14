/* eslint-disable no-nested-ternary */
import { Box, Button, Tooltip } from '@material-ui/core';
import {
  useDeployPermission,
  useUndeployPermission,
} from '@openchoreo/backstage-plugin-react';
import { EnvironmentActionsProps } from '../types';

interface PromoteButtonProps {
  targetName: string;
  resourceName?: string;
  requiresApproval?: boolean;
  isPromoting: boolean;
  isAlreadyPromoted: boolean;
  isFullWidth?: boolean;
  onPromote: () => void;
}

/**
 * Single promote button — has its own permission hook so each promotion
 * target is evaluated against its own environment (honors ABAC
 * `resource.environment` per openchoreo#3408).
 */
const PromoteButton = ({
  targetName,
  isPromoting,
  isAlreadyPromoted,
  isFullWidth,
  requiresApproval,
  onPromote,
}: PromoteButtonProps) => {
  const { canDeploy, loading, deniedTooltip } = useDeployPermission(targetName);

  const label = isAlreadyPromoted
    ? isFullWidth
      ? `Promoted to ${targetName}`
      : 'Promoted'
    : isPromoting
    ? 'Promoting...'
    : isFullWidth
    ? `Promote to ${targetName}`
    : 'Promote';

  return (
    <Tooltip title={deniedTooltip}>
      <span>
        <Button
          style={isFullWidth ? undefined : { marginRight: '8px' }}
          variant="contained"
          color="primary"
          size="small"
          disabled={loading || !canDeploy || isPromoting || isAlreadyPromoted}
          onClick={onPromote}
        >
          {label}
          {!isAlreadyPromoted &&
            requiresApproval &&
            !isPromoting &&
            ' (Approval Required)'}
        </Button>
      </span>
    </Tooltip>
  );
};

/**
 * Action buttons for promotion, undeployment, and redeployment of environment deployments
 */
export const EnvironmentActions = ({
  environmentName,
  bindingName,
  deploymentStatus,
  statusReason,
  promotionTargets,
  isAlreadyPromoted,
  promotionTracker,
  suspendTracker,
  onPromote,
  onSuspend,
  onRedeploy,
}: EnvironmentActionsProps) => {
  // Undeploy/redeploy acts on the current environment, so its permission is
  // evaluated against `environmentName`.
  const {
    canUndeploy,
    loading: undeployPermissionLoading,
    deniedTooltip: undeployDeniedTooltip,
  } = useUndeployPermission(environmentName);

  const isUndeployed = statusReason === 'ResourcesUndeployed';

  const hasPromotionTargets =
    deploymentStatus === 'Ready' &&
    promotionTargets &&
    promotionTargets.length > 0;
  const hasMultipleTargets =
    hasPromotionTargets && promotionTargets && promotionTargets.length > 1;
  const hasSingleTarget =
    hasPromotionTargets && promotionTargets && promotionTargets.length === 1;

  // Don't render if there's nothing to show
  if (!hasPromotionTargets && !bindingName) {
    return null;
  }

  return (
    <Box mt="auto" mb={2}>
      {/* Multiple promotion targets - stack vertically */}
      {hasMultipleTargets &&
        promotionTargets!.map((target, index) => (
          <Box
            key={target.name}
            display="flex"
            justifyContent="flex-end"
            mb={index < promotionTargets!.length - 1 ? 2 : bindingName ? 2 : 0}
          >
            <PromoteButton
              targetName={target.name}
              resourceName={target.resourceName}
              requiresApproval={target.requiresApproval}
              isPromoting={promotionTracker.isActive(target.name)}
              isAlreadyPromoted={isAlreadyPromoted(target.name)}
              isFullWidth
              onPromote={() => onPromote(target.resourceName ?? target.name)}
            />
          </Box>
        ))}

      {/* Single promotion target and undeploy/redeploy button - show in same row */}
      {(hasSingleTarget || bindingName) && (
        <Box display="flex" flexWrap="wrap" justifyContent="flex-end">
          {/* Single promotion button */}
          {hasSingleTarget && (
            <PromoteButton
              targetName={promotionTargets![0].name}
              resourceName={promotionTargets![0].resourceName}
              requiresApproval={promotionTargets![0].requiresApproval}
              isPromoting={promotionTracker.isActive(promotionTargets![0].name)}
              isAlreadyPromoted={isAlreadyPromoted(promotionTargets![0].name)}
              onPromote={() =>
                onPromote(
                  promotionTargets![0].resourceName ??
                    promotionTargets![0].name,
                )
              }
            />
          )}

          {/* Undeploy / Redeploy button - show whenever there's a binding */}
          {bindingName && (
            <Tooltip title={undeployDeniedTooltip}>
              <span>
                {isUndeployed ? (
                  <Button
                    variant="contained"
                    color="primary"
                    size="small"
                    disabled={
                      undeployPermissionLoading ||
                      suspendTracker.isActive(environmentName) ||
                      !canUndeploy
                    }
                    onClick={onRedeploy}
                  >
                    {suspendTracker.isActive(environmentName)
                      ? 'Redeploying...'
                      : 'Redeploy'}
                  </Button>
                ) : (
                  <Button
                    variant="outlined"
                    color="secondary"
                    size="small"
                    disabled={
                      undeployPermissionLoading ||
                      suspendTracker.isActive(environmentName) ||
                      !canUndeploy
                    }
                    onClick={onSuspend}
                  >
                    {suspendTracker.isActive(environmentName)
                      ? 'Undeploying...'
                      : 'Undeploy'}
                  </Button>
                )}
              </span>
            </Tooltip>
          )}
        </Box>
      )}
    </Box>
  );
};
