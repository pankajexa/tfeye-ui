import loaderLogo from "../../../assets/images/Squarebox-logo.svg";
export const LogoSpinner = ({ className = "h-12 animate-spin" }) => {
  return <img src={loaderLogo} alt="Squarebox Logo" className={className} />;
};

export const LoadingScreen = () => {
  return (
    <div className="h-screen w-full flex items-center flex-col justify-center">
      <img
        src={loaderLogo}
        alt="Squarebox Logo"
        className="h-12 animate-spin"
      />
    </div>
  );
};

const Loader = () => {
  return (
    <div className="flex items-center justify-center min-h-96 max-h-screen bg-background">
      <div className="relative">
        {/* <div className="relative w-24 h-16">
          <div className="absolute inset-0 border-4 border-slate-700 rounded-full opacity-30"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-12 bg-slate-700 rounded-sm">
            <div
              className="absolute top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 rounded-full bg-red-500 animate-pulse"
              style={{ animationDelay: "0s", animationDuration: "1.5s" }}
            ></div>

            <div
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-yellow-500 animate-pulse"
              style={{ animationDelay: "0.5s", animationDuration: "1.5s" }}
            ></div>
            <div
              className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 rounded-full bg-green-500 animate-pulse"
              style={{ animationDelay: "1s", animationDuration: "1.5s" }}
            ></div>
          </div>
          <div
            className="absolute inset-0 bg-white rounded-full animate-ping opacity-20"
            style={{ animationDuration: "2s" }}
          ></div>
        </div> */}
        <div>
          <img
            src={loaderLogo}
            alt="Squarebox Logo"
            className="h-12 animate-spin"
          />
        </div>

        {/* <div className="mt-4 text-center">
          <div className="text-primary text-sm mt-1 animate-pulse">
            Loading...
          </div>
        </div> */}
      </div>
    </div>
  );
};

export default Loader;
