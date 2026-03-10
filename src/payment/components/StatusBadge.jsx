import theme from "../../theme";

const StatusBadge = ({ status }) => {
  const getVariant = () => {
    switch (status) {
      case "success":
        return theme.components.badge.variants.success;
      case "failed":
        return theme.components.badge.variants.error;
      case "pending":
        return theme.components.badge.variants.warning;
      case "refunded":
        return theme.components.badge.variants.default;
      default:
        return theme.components.badge.variants.default;
    }
  };

  const variant = getVariant();

  return (
    <span
      style={{
        background: variant.background,
        color: variant.color,
        padding: `${theme.components.badge.paddingY} ${theme.components.badge.paddingX}`,
        borderRadius: theme.components.badge.borderRadius,
        fontSize: theme.components.badge.fontSize,
        fontWeight: theme.components.badge.fontWeight,
      }}
    >
      {status.toUpperCase()}
    </span>
  );
};

export default StatusBadge;