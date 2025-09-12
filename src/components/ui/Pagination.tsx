import { useEffect } from "react";
import { HiArrowRight, HiArrowLeft } from "react-icons/hi";
import ReactPaginate from "react-paginate";

const Pagination = (props) => {
  const { totalLength, itemsPerPage, handlePageClick, currentPage } = props;

  const handleClick = (selectedPage) => {
    handlePageClick(selectedPage);
  };
  useEffect(() => {}, [totalLength]);

  return (
    <ReactPaginate
      nextLabel={
        <span className="flex items-center gap-1">
          Next <HiArrowRight />
        </span>
      }
      onPageChange={handleClick}
      pageRangeDisplayed={3}
      marginPagesDisplayed={2}
      pageCount={Math.ceil(totalLength / itemsPerPage)}
      forcePage={currentPage - 1}
      previousLabel={
        <span className="flex items-center gap-1">
          <HiArrowLeft /> Previous
        </span>
      }
      pageClassName="page-item"
      pageLinkClassName="page-link"
      previousClassName="previous-item cursor-pointer bg-white py-1.5  px-3.5 hover:bg-purple-700 text-gray-500 hover:text-white rounded-md w-fit border border-gray-200 hover:border-0"
      previousLinkClassName="previous-link"
      nextClassName="next-item bg-white cursor-pointer py-1.5 px-3.5 hover:bg-purple-700 text-gray-500 hover:text-white rounded-md w-fit border border-gray-200 hover:border-0"
      nextLinkClassName="next-link"
      breakLabel="..."
      breakClassName="page-item"
      breakLinkClassName="page-link"
      containerClassName="pagination-container cursor-pointer flex gap-4 items-center"
      activeClassName="active-page bg-purple-50 px-4 py-2 rounded-md text-purple font-semibold"
      renderOnZeroPageCount={null}
    />
  );
};

export default Pagination;
