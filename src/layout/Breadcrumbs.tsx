import { useLocation, Link } from "react-router-dom";

export default function Breadcrumbs() {
  const location = useLocation();

  const paths = location.pathname.split("/").filter(Boolean);

  return (
    <div className="text-sm text-gray-500 mb-3">
      <Link to="/dashboard">Home</Link>

      {paths.map((p, i) => {
        const to = "/" + paths.slice(0, i + 1).join("/");

        return (
          <span key={to}>
            {" / "}
            <Link to={to}>{p}</Link>
          </span>
        );
      })}
    </div>
  );
}