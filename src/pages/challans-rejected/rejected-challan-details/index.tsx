import ChallanDetails from "@/components/ImageDetails/ChallanDetails";
import { useParams, useSearchParams } from "react-router-dom";

const RejectedChallanDetails = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();

  const pointName = searchParams.get("sub_status");
  const page = searchParams.get("page");
  // base url
  let url = `api/v1/analyses?status=rejected&items_per_page=50&page=${
    page || 1
  }`;

  let status="status=rejected"

  // append point_name only if present
  if (pointName) {
    url += `&sub_status=${encodeURIComponent(pointName)}`;
    status += `&sub_status=${encodeURIComponent(pointName)}`;
  }

  return (
    <ChallanDetails id={id} url={url} page={page || 1} status={status} />
  );
};

export default RejectedChallanDetails;
