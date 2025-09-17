import { Button } from "../ui/button";
import { Modal } from "@/components/ui/modal";

const PreviousChallanaDetails = ({ previousChallans, setPreviousChallans }) => {
  return (
    <Modal
      open={previousChallans !== null}
      onOpenChange={(o) => {
        if (!o) setPreviousChallans(null);
      }}
      title="Previous Challan Details"
      size="lg"
      description=""
      children={
        previousChallans ? (
          <div className="space-y-4">
            {/* Vehicle Info */}
            <div className="space-y-2 grid lg:grid-cols-2 text-sm text-primary">
              <p>
                <strong>Regn No:</strong> {previousChallans?.data?.regnNo}
              </p>
              <p>
                <strong>Color:</strong> {previousChallans?.data?.color}
              </p>
              <p>
                <strong>Wheeler:</strong> {previousChallans?.data?.wheeler}
              </p>
              <p>
                <strong>Maker:</strong> {previousChallans?.data?.maker}
              </p>
              <p>
                <strong>Model:</strong> {previousChallans?.data?.model}
              </p>
              <p>
                <strong>Vehicle Type:</strong> {previousChallans?.data?.vehtype}
              </p>
            </div>

            {/* Images */}
            <div>
              <h3 className="text-sm font-semibold mb-2">
                Previous Challan Images
              </h3>
              {previousChallans?.data?.imageURLs?.length > 0 ? (
                <div className="grid grid-cols-2 gap-3">
                  {previousChallans?.data?.imageURLs?.map(
                    (url: string, idx: number) => (
                      <a href={url} target="_blank" key={idx}>
                        <img
                          src={url}
                          alt={`Challan-${idx}`}
                          className="w-full h-32 object-cover rounded border"
                        />
                      </a>
                    )
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No previous challan images available for this vehicle.</p>
                  <p className="text-sm mt-2">
                    This shows vehicle details from RTA database. Previous
                    challan images are not available through this data source.
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : null
      }
      footer={
        <div className="flex justify-end gap-4">
          <Button variant="outline" onClick={() => setPreviousChallans(null)}>
            Close
          </Button>
        </div>
      }
    />
  );
};

export default PreviousChallanaDetails;
