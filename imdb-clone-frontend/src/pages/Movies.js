import React, { useEffect, useState, useRef } from "react";
import { Button, Modal } from "react-bootstrap";
import { useForm, Controller } from "react-hook-form";
import { useDropzone } from "react-dropzone";
import { ToastContainer, toast } from "react-toastify";
import Loader from "../components/Loader";
import { usePagination, useSorting } from "../services/CommonServices.js";
import { postData, getData, deleteData, putData } from "../services/ApiServices.js";
import Pagination from "../components/Pagination.js";
import Search from "../components/Search.js";
import Select from 'react-select';
import FilterComponent from "../components/FilterComponent.js";

const Movies = () => {
    const [show, setShow] = useState(false);
    const [posterPreview, setPosterPreview] = useState(null);
    const { control, handleSubmit, reset, setValue, formState: { errors } } = useForm({
        defaultValues: {
            name: "", yearOfRelease: "", plot: "", ratings: "", producernames: "", actornames: ""
        }
    });

    const [loading, setLoading] = useState(false);
    //for the contnent in the plot
    const [showModal, setShowModal] = useState(false);
    const [modalContent, setModalContent] = useState('');
    const [posterUrl, setPosterUrl] = useState(null);
    const [id, setId] = useState(null);

    // Filter Options
    const [filterOptions, setFilterOptions] = useState({});

    // For dropdown data
    const [producersDropdown, setProducersDropdown] = useState([]);
    const [actorsDropdown, setActorsDropdown] = useState([]);

    //For Handling Data Pagination
    const [tableData, setTableData] = useState([]);
    const [response, setRespose] = useState([]);
    const [actionItems, setActionItems] = useState([]);
    const [enums, setEnums] = useState([]);
    const [paginationDataLimit, setPaginationDataLimit] = useState({ "skip": 0, "limit": 15 });
    const { tableSorting, sortingData } = useSorting();

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
        const url = "movies/pagination";
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

            setRespose(result);

            setTableData(result.records);

        } catch (e) {
            toast.error(e.response.data.message);
        } finally {
            setLoading(false);
        }
    }

    const handleShowMore = (fullText) => {
        setModalContent(fullText);
        setShowModal(true);
    };

    const truncateText = (text, wordLimit) => {
        const words = text.split(' ');
        if (words.length > wordLimit) {
            return (
                <>
                    {words.slice(0, wordLimit).join(' ')}...
                    <button onClick={() => handleShowMore(text)} className="btn btn-link p-0">Show More</button>
                </>
            );
        }
        return text;
    };

    const getActionItems = async (id) => {
        const url = `movies/action/items/${id}`;
        setLoading(true);
        try {
            let result = await getData(url);
            setActionItems(result);
        } catch (e) {
            toast.error(e.response.data.message);
        } finally {
            setLoading(false);
        }
    }

    const getEnums = async () => {
        const url = `enums/actionItems`;
        setLoading(true);
        try {
            let result = await getData(url);
            setEnums(result);
        } catch (e) {
            toast.error(e.response.data.message);
        } finally {
            setLoading(false);
        }
    }

    const getFilterOptions = async () => {
        const url = `movies/filter/options`;
        setLoading(true);
        try {
            let result = await getData(url);
            setFilterOptions(result);
        } catch (e) {
            toast.error(e.response.data.message);
        } finally {
            setLoading(false);
        }
    }

    const handleDelete = async (id) => {
        const url = `movies/${id}`;
        setLoading(true);
        try {
            let result = await deleteData(url);
            getTableData();
            toast.success(result);
        } catch (e) {
            toast.error(e.response.data.message);
        } finally {
            setLoading(false);
        }
    }

    const getPersonsForDropdown = async () => {
        const url = `movies/dropdown/persons`;
        setLoading(true);
        try {
            let result = await getData(url);
            setActorsDropdown(result?.[0]?.actors);
            setProducersDropdown(result?.[0]?.producers);
        } catch (e) {
            toast.error(e.response.data.message);
        } finally {
            setLoading(false);
        }
    }

    const getMovieForEdit = async (id) => {
        setId(id);
        const url = `movies/${id}`;
        setLoading(true);
        try {
            let result = await getData(url);
            if (result && Object.keys(result).length) {
                setValue("name", result.name);
                setValue("yearOfRelease", result.yearOfRelease);
                setValue("plot", result.plot);
                setValue("ratings", result.ratings);
                setValue("producernames", result.producers);
                setValue("actornames", result.actors);
                setPosterPreview(result.poster);
                setPosterUrl(result.poster);
                setValue("poster", result.poster);
            }
            handleOpenModal();
        } catch (e) {
            toast.error(e.response.data.message);
        } finally {
            setLoading(false);
        }
    }


    // Submit handler
    const onSubmit = async (data) => {
        let obj = {};
        if (data && Object.keys(data).length) {
            obj = {
                name: data.name ? data.name : null,
                yearOfRelease: data.yearOfRelease ? parseInt(data.yearOfRelease) : null,
                plot: data.plot ? data.plot : null,
                ratings: data.ratings ? parseInt(data.ratings) : null,
                poster: posterUrl || null,
                producerIds: (data.producernames && data.producernames.length) ? data.producernames.map((prod) => prod.value) : [],
                actorIds: (data.actornames && data.actornames.length) ? data.actornames.map((act) => act.value) : []
            }
        }
        if (id) {
            setLoading(true);
            try {
                const url = `movies/${id}`
                let result = await putData(url, obj);
                toast.success(result);
                handleCloseModal();
            } catch (e) {
                toast.error(e.response.data.message);
            } finally {
                setLoading(false);
            }
        } else {
            setLoading(true);
            try {
                const url = `movies/`
                let result = await postData(url, obj);
                toast.success(result);
                handleCloseModal();
            } catch (e) {
                toast.error(e.response.data.message);
            } finally {
                setLoading(false);
            }
        }
    };


    useEffect(() => {
        getTableData();
    }, [paginationFunction, sortingData]);

    useEffect(() => {
        sessionStorage.removeItem('filter');
        sessionStorage.removeItem('search');
    }, ['']);

    useEffect(() => {
        getEnums();
        getFilterOptions();
    }, []);


    // DropZone Related Config
    const acceptedFileTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    const { getRootProps, getInputProps } = useDropzone({
        accept: acceptedFileTypes, // Accept only image files (JPEG, PNG, JPG)
        onDrop: async (acceptedFiles) => {
            const file = acceptedFiles[0];
            const url = "s3/upload"

            // Check if the file type is valid
            const fileExtension = file.name.split('.').pop().toLowerCase();
            if (file && !acceptedFileTypes.includes(file.type) && !['jpeg', 'png', 'jpg'].includes(fileExtension)) {
                toast.error('Only JPEG, PNG, and JPG files are allowed.');
                setPosterPreview(null);
            } else {
                setPosterPreview(URL.createObjectURL(file));
                setValue("poster", file);
                setLoading(true);
                try {
                    let attachmentResult = await postData(url, { file: file, type: "image" }, {
                        headers: {
                            'Content-Type': 'multipart/form-data'
                        }
                    });
                    setPosterUrl(attachmentResult.fileUrl);
                    toast.success(attachmentResult.message);
                } catch (e) {
                    toast.error(e.response.data.message);
                } finally {
                    setLoading(false);
                }
            }
        },
    });

    // Handlers for modal visibility
    const handleOpenModal = () => {
        getPersonsForDropdown();
        setShow(true);
    };
    const handleCloseModal = () => {
        setShow(false);
        reset();
        setPosterPreview(null);
        setPosterUrl(null);
        setActorsDropdown([]);
        setProducersDropdown([]);
        getTableData();
        setId(null)
    };

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
                                    <h4>Movies</h4>
                                </div>
                                <div className="d-flex align-items-center gap-2">
                                    <button className="btn btn-sm btn-primary" onClick={() => handleOpenModal()}>
                                        <span className="align-middle">Add Movie</span>
                                    </button>
                                    <FilterComponent getData={getTableData} filterOptions={filterOptions} />
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
                                        <th>Poster</th>
                                        <th className="sorting" onClick={(e) => tableSorting(e, 'name')}>Name</th>
                                        <th className="sorting" onClick={(e) => tableSorting(e, 'yearOfRelease')}>Year of Release</th>
                                        <th className="sorting" onClick={(e) => tableSorting(e, 'plot')}>Plot</th>
                                        <th className="sorting" onClick={(e) => tableSorting(e, 'actors.name')}>Actors</th>
                                        <th className="sorting" onClick={(e) => tableSorting(e, 'producers.name')}>Producers</th>
                                        <th className="sorting" onClick={(e) => tableSorting(e, 'ratings')}>Ratings <span style={{ fontSize: '9px' }}>(Out of 10)</span></th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {tableData.length > 0 ? (
                                        tableData.map((record, i) => (
                                            <tr key={i}>
                                                <td>
                                                    <a href={record.poster}
                                                        target="_blank"
                                                        rel="noopener noreferrer">
                                                        <img
                                                            src={record.poster}
                                                            alt="Movie Poster"
                                                            className="img-thumbnail"
                                                            style={{ width: '80px', height: '100px' }}
                                                        />
                                                    </a>
                                                </td>
                                                <td>{record.name}</td>
                                                <td>{record.yearOfRelease}</td>
                                                <td>{record.plot ? truncateText(record.plot, 15) : "-"}</td>
                                                <td>{(record.actorNames && record.actorNames.length) ? record.actorNames.join(", ") : "-"}</td>
                                                <td>{(record.producerNames && record.producerNames.length) ? record.producerNames.join(", ") : "-"}</td>
                                                <td>{record.ratings}</td>
                                                <td className="action-dropdown">
                                                    <div className="dropdown" onClick={() => getActionItems(record.id)}>
                                                        <a className="btn" type="button" data-bs-toggle="dropdown" aria-expanded="true">
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-three-dots" viewBox="0 0 16 16">
                                                                <path d="M3 9.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3m5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3m5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3" />
                                                            </svg>
                                                        </a>
                                                        <ul className="dropdown-menu dropdown-menu-end">
                                                            {actionItems.includes(enums?.action?.EDIT) && (
                                                                <li>
                                                                    <a className="dropdown-item text-primary" onClick={() => { getMovieForEdit(record.id) }}>
                                                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-pen" viewBox="0 0 16 16">
                                                                            <path d="m13.498.795.149-.149a1.207 1.207 0 1 1 1.707 1.708l-.149.148a1.5 1.5 0 0 1-.059 2.059L4.854 14.854a.5.5 0 0 1-.233.131l-4 1a.5.5 0 0 1-.606-.606l1-4a.5.5 0 0 1 .131-.232l9.642-9.642a.5.5 0 0 0-.642.056L6.854 4.854a.5.5 0 1 1-.708-.708L9.44.854A1.5 1.5 0 0 1 11.5.796a1.5 1.5 0 0 1 1.998-.001m-.644.766a.5.5 0 0 0-.707 0L1.95 11.756l-.764 3.057 3.057-.764L14.44 3.854a.5.5 0 0 0 0-.708z" />
                                                                        </svg><span className="icon-text">Edit</span>
                                                                    </a>
                                                                </li>
                                                            )}
                                                            {actionItems.includes(enums?.action?.DELETE) && (
                                                                <li>
                                                                    <a className="dropdown-item text-primary" onClick={() => handleDelete(record.id)}>
                                                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-trash" viewBox="0 0 16 16">
                                                                            <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0z" />
                                                                            <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4zM2.5 3h11V2h-11z" />
                                                                        </svg><span className="icon-text">Delete</span>
                                                                    </a>
                                                                </li>
                                                            )}
                                                        </ul>
                                                    </div>
                                                </td>

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

            <Modal show={show} onHide={handleCloseModal} size="xl">
                <Modal.Header closeButton>
                    {id ? (<Modal.Title>Edit Movie</Modal.Title>) : (<Modal.Title>Add Movie</Modal.Title>)}
                </Modal.Header>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <Modal.Body>
                        <div className="row">
                            {/* Left Column */}
                            <div className="col-md-6">
                                <div className="mb-3">
                                    <label htmlFor="name" className="form-label">
                                        Movie Name
                                    </label>
                                    <Controller
                                        name="name"
                                        control={control}
                                        defaultValue=""
                                        rules={{ required: "Movie name is required" }}
                                        render={({ field }) => (
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={field.value}
                                                id="name"
                                                {...field}
                                            />
                                        )}
                                    />
                                    {errors.name && <div className="text-danger">{errors.name.message}</div>}
                                </div>
                                <div className="mb-3">
                                    <label htmlFor="yearOfRelease" className="form-label">
                                        Year of Release
                                    </label>
                                    <Controller
                                        name="yearOfRelease"
                                        control={control}
                                        defaultValue=""
                                        rules={{
                                            required: "Year of release is required",
                                            pattern: {
                                                value: /^\d{4}$/,
                                                message: "Year of release must be a 4-digit number",
                                            },
                                        }}
                                        render={({ field }) => (
                                            <input
                                                type="number"
                                                value={field.value}
                                                className="form-control"
                                                id="yearOfRelease"
                                                {...field}
                                            />
                                        )}
                                    />
                                    {errors.yearOfRelease && <div className="text-danger">{errors.yearOfRelease.message}</div>}
                                </div>
                                <div className="mb-3">
                                    <label htmlFor="plot" className="form-label">
                                        Plot
                                    </label>
                                    <Controller
                                        name="plot"
                                        control={control}
                                        defaultValue=""
                                        rules={{ required: "Plot is required" }}
                                        render={({ field }) => (
                                            <textarea
                                                className="form-control"
                                                value={field.value}
                                                id="plot"
                                                {...field}
                                            />
                                        )}
                                    />
                                    {errors.plot && <div className="text-danger">{errors.plot.message}</div>}
                                </div>
                                <div className="mb-3">
                                    <label htmlFor="rating" className="form-label">
                                        Rating
                                    </label>
                                    <Controller
                                        name="ratings"
                                        control={control}
                                        defaultValue=""
                                        rules={{
                                            required: "Rating is required",
                                            min: { value: 3, message: "Rating must be at least 3" },
                                            max: { value: 10, message: "Rating must not exceed 10" },
                                        }}
                                        render={({ field }) => (
                                            <input
                                                type="number"
                                                value={field.value}
                                                className="form-control"
                                                id="ratings"
                                                {...field}
                                            />
                                        )}
                                    />
                                    {errors.ratings && <div className="text-danger">{errors.ratings.message}</div>}
                                </div>
                            </div>

                            {/* Right Column */}
                            <div className="col-md-6">
                                <div className="mb-3">
                                    <label htmlFor="producernames" className="form-label">
                                        Producers
                                    </label>
                                    <Controller
                                        name="producernames"
                                        control={control}
                                        defaultValue={[]}
                                        rules={{ required: "Producer is required" }}
                                        render={({ field }) => (
                                            <Select
                                                isMulti
                                                id="producernames"
                                                options={producersDropdown}
                                                value={field.value}
                                                closeMenuOnSelect={false}
                                                onChange={field.onChange}
                                            />
                                        )}
                                    />
                                    {errors.producernames && <div className="text-danger">{errors.producernames.message}</div>}
                                </div>
                                <div className="mb-3">
                                    <label htmlFor="actornames" className="form-label">
                                        Actors
                                    </label>
                                    <Controller
                                        name="actornames"
                                        control={control}
                                        defaultValue={[]}
                                        rules={{ required: "Actor is required" }}
                                        render={({ field }) => (
                                            <Select
                                                isMulti
                                                id="actornames"
                                                options={actorsDropdown}
                                                value={field.value}
                                                closeMenuOnSelect={false}
                                                onChange={field.onChange}
                                            />
                                        )}
                                    />
                                    {errors.actornames && <div className="text-danger">{errors.actornames.message}</div>}
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Upload Poster</label>
                                    <Controller
                                        name="poster"
                                        control={control}
                                        rules={{ required: "Poster is required" }}
                                        render={({ field }) => (
                                            <div
                                                id="poster"
                                                {...getRootProps()}
                                                className="border p-3 text-center"
                                                style={{ cursor: "pointer" }}
                                                {...field}
                                            >
                                                <input {...getInputProps()} />
                                                {posterPreview ? (
                                                    <div style={{ position: "relative" }}>
                                                        <img
                                                            src={posterPreview}
                                                            alt="Poster Preview"
                                                            className="img-thumbnail"
                                                            style={{ maxHeight: "300px" }}
                                                        />
                                                    </div>
                                                ) : (
                                                    <p>Click or drag an image to upload</p>
                                                )}
                                                {errors.poster && <div className="text-danger">{errors.poster.message}</div>}
                                            </div>
                                        )}
                                    />
                                </div>
                            </div>
                        </div>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => handleCloseModal()}>
                            Close
                        </Button>
                        {id ? (<Button type="submit" variant="primary">
                            Update
                        </Button>) : (<Button type="submit" variant="primary">
                            Add
                        </Button>)}
                    </Modal.Footer>
                </form>
            </Modal>

            {/* For the extra text */}
            <Modal show={showModal} onHide={() => setShowModal(false)} size="xl">
                <Modal.Header closeButton>
                    <Modal.Title>Full Content</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p>{modalContent}</p>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowModal(false)}>
                        Close
                    </Button>
                </Modal.Footer>
            </Modal>
        </div >
    );
};

export default Movies;
