export const SidebarSkeleton = () => (
  <div className="sidebar-skeleton">
    {[...Array(6)].map((_, i) => (
      <div key={i} className="sidebar-skeleton__item" style={{ opacity: 1 - i * 0.12 }} />
    ))}
  </div>
);