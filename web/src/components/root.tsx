import { Outlet } from 'react-router-dom';

export const Root = () => {
  return (
    <div className="h-screen w-screen">
      <Outlet />
    </div>
  );
};
