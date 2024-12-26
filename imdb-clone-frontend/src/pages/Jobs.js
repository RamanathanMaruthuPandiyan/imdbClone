import React, { useEffect, useState, useRef } from "react";
import { ToastContainer, toast } from "react-toastify";
import Loader from "../components/Loader";
import { usePagination, useSorting } from "../services/CommonServices.js";
import { postData, getData } from "../services/ApiServices.js";
import Pagination from "../components/Pagination.js";
import Search from "../components/Search.js";

const Jobs = () => {
    const [loading, setLoading] = useState(false);

    //For Handling Data Pagination
    const [tableData, setTableData] = useState([]);
    const [response, setRespose] = useState([]);
    const [jobEnums, setJobEnums] = useState([]);
    const [paginationDataLimit, setPaginationDataLimit] = useState({ "skip": 0, "limit": 15 });
    const { tableSorting, sortingData } = useSorting();

    const statusStyles = {
        NS: { backgroundColor: "#f8f9fa", color: "#6c757d" }, // Gray
        IP: { backgroundColor: "#fff3cd", color: "#856404" }, // Yellow
        CO: { backgroundColor: "#d4edda", color: "#155724" }, // Green
        ER: { backgroundColor: "#f8d7da", color: "#721c24" } // Red
    };

    const { paginationFunction,
        handleNextPage,
        handlePreviousPage,
        handleInputChange,
        totalPages,
        pagination,
        setPagination,
        selectedDataList,
        setSelectedDataList,
        currentPage,
        setCurrentPage } = usePagination(response, paginationDataLimit);

    let paginationQuery;
    const queryFunction = (isFilter) => {
        if (isFilter) {
            setCurrentPage(1);
            paginationQuery = { "skip": 0, "limit": (pagination.limit || 15) };
            setSelectedDataList(pagination.limit || 15);
            setPagination(paginationQuery);
            setPaginationDataLimit(paginationQuery);
        } else {
            paginationQuery = pagination.limit ? { "skip": pagination.skip, "limit": pagination.limit } : paginationDataLimit;
            setPaginationDataLimit(paginationQuery);
        }
    }

    const getTableData = async (isFilter) => {
        const url = "jobs/pagination";
        setLoading(true);
        try {
            let query = {};
            queryFunction(isFilter);

            const filters = JSON.parse(sessionStorage.getItem('filter'));
            const search = sessionStorage.getItem('search');

            if (filters) {
                query.filter = filters;
            }

            if (search) {
                query.search = search;
            }

            if (Object.keys(sortingData).length) {
                query.sort = sortingData;
            }

            query = { ...query, ...paginationQuery }

            const result = await postData(url, query);

            console.log('====================================');
            console.log(result);
            console.log('====================================');

            setRespose(result);

            setTableData(result.records);

        } catch (e) {
            toast.error(e.response.data.message);
        } finally {
            setLoading(false);
        }
    }

    const getJobEnums = async () => {
        const url = `enums/jobs`;
        setLoading(true);
        try {
            let result = await getData(url);
            setJobEnums(result);
        } catch (e) {
            toast.error(e.response.data.message);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        getTableData();
    }, [paginationFunction, sortingData]);

    useEffect(() => {
        sessionStorage.removeItem('filter');
        sessionStorage.removeItem('search');
    }, ['']);

    useEffect(() => {
        getJobEnums();
    }, []);

    return (
        <div>
            <ToastContainer />
            <Loader loading={loading} />
            <div className="row">
                <div className="col">
                    <div className="row mt-2">
                        <div className="col-md base-title">
                            <div className="d-flex justify-content-between align-items-center">
                                <div className="d-flex align-items-center">
                                    <h4>Jobs</h4>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div style={{ marginTop: 10 }}>
                        <Search getData={getTableData} disabled={false} />
                    </div>

                    {/* Table Section */}
                    <div className="row mt-3">
                        <div className="col">
                            <table className="table table-bordered table-hover">
                                <thead className="table-primary">
                                    <tr>
                                        <th className="sorting" onClick={(e) => tableSorting(e, 'name')}>Name</th>
                                        <th className="sorting" onClick={(e) => tableSorting(e, 'created')}>Creation Time</th>
                                        <th className="sorting" onClick={(e) => tableSorting(e, 'started')}>Started Time</th>
                                        <th className="sorting" onClick={(e) => tableSorting(e, 'ended')}>Completed Time</th>
                                        <th className="sorting" onClick={(e) => tableSorting(e, 'completionPercentage')}>Completion<br></br>Percentage</th>
                                        <th className="sorting" onClick={(e) => tableSorting(e, 'status')}>Status</th>
                                        <th>Reason</th>
                                        <th>Message</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {tableData.length > 0 ? (
                                        tableData.map((record, i) => (
                                            <tr key={i}>
                                                <td>{record.name ? (jobEnums && Object.keys(jobEnums).length) ? jobEnums.names.descriptions[record.name] : "-" : "-"}</td>
                                                <td>{record.created}</td>
                                                <td>{record.started}</td>
                                                <td>{record.ended}</td>
                                                <td>{record.completionPercentage}</td>
                                                <td><span
                                                    style={{
                                                        ...statusStyles[record.status],
                                                        padding: "5px 10px",
                                                        borderRadius: "20px",
                                                        fontWeight: "bold",
                                                        whiteSpace: "nowrap",
                                                        display: "inline-block",
                                                    }}
                                                >
                                                    {record.status ? (jobEnums && Object.keys(jobEnums).length) ? jobEnums.status.descriptions[record.status] : "-" : "-"}</span>
                                                </td>
                                                <td>{record.reason ? record.reason : "-"}</td>
                                                <td>{record.message ? record.message : "-"}</td>

                                            </tr>))
                                    ) : (
                                        <tr>
                                            <td colSpan="8" className='text-center'>No Records Found</td>
                                        </tr>
                                    )}

                                </tbody>
                            </table>
                            <Pagination
                                currentPage={currentPage}
                                paginationDataLimit={paginationDataLimit}
                                response={response}
                                selectedDataList={selectedDataList}
                                setSelectedDataList={setSelectedDataList}
                                handleInputChange={handleInputChange}
                                handlePreviousPage={handlePreviousPage}
                                handleNextPage={handleNextPage}
                                totalPages={totalPages}
                            />
                        </div>
                    </div>
                </div>
            </div >
        </div >
    );
};

export default Jobs;
