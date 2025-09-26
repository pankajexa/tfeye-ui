import ChallanDetails from "@/components/ImageDetails/ChallanDetails";
import { useParams, useSearchParams } from "react-router-dom";

const PendingChallan = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();

  const pointName = searchParams.get("point_name");
  const page = searchParams.get("page");

  // URL for fetching the list including the target challan
  let url = `api/v1/analyses?status=pending&items_per_page=50&page=${
    page || 1
  }`;
  let status = "status=pending";
  if (pointName) {
    url += `&point_name=${encodeURIComponent(pointName)}`;
    status += `&point_name=${encodeURIComponent(pointName)}`;
  }

  return <ChallanDetails id={id} url={url} page={page || 1} status={status} />;
};

export default PendingChallan;
