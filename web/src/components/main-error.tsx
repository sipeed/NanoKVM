import { Button } from 'antd';

export const MainError = () => {
  return (
    <div
      className="flex h-screen w-screen flex-col items-center justify-center space-y-5"
      role="alert"
    >
      <h2 className="text-lg font-semibold text-red-500">
        Sorry, there seems to be some problems :(
      </h2>
      <Button type="primary" danger onClick={() => window.location.assign(window.location.origin)}>
        Refresh
      </Button>
    </div>
  );
};
