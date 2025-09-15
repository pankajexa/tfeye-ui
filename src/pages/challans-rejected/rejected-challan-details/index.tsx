import ChallanDetails from "@/components/ImageDetails/ChallanDetails";
import { useParams, useSearchParams } from "react-router-dom";

const RejectedChallanDetails = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();

  const pointName = searchParams.get("sub_status");

  // base url
  let url = `api/v1/analyses?status=rejected&items_per_page=50&page=1`;

  // append point_name only if present
  if (pointName) {
    url += `&sub_status=${encodeURIComponent(pointName)}`;
  }

  return <ChallanDetails id={id} url={url} />;
};

export default RejectedChallanDetails;
