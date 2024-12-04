export const Wifi = () => {
  function open() {
    window.open('/#/wifi', '_blank');
  }

  return (
    <div
      className="flex cursor-pointer select-none items-center rounded px-3 py-1.5 hover:bg-neutral-600"
      onClick={open}
    >
      Wi-Fi
    </div>
  );
};
