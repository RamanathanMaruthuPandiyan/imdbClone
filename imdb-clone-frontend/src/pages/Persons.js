import React, { useEffect, useState, useRef } from "react";
import { Button, Modal } from "react-bootstrap";
import { useForm, Controller } from "react-hook-form";
import { ToastContainer, toast } from "react-toastify";
import Loader from "../components/Loader";
import { usePagination, useSorting } from "../services/CommonServices.js";
import { postData, getData, deleteData, putData } from "../services/ApiServices.js";
import Pagination from "../components/Pagination.js";
import Search from "../components/Search.js";
import Select from 'react-select';
import FilterComponent from "../components/FilterComponent.js";

const Persons = () => {
    const [show, setShow] = useState(false);
    const { control, handleSubmit, reset, setValue, formState: { errors } } = useForm({
        defaultValues: {
            name: "", gender: "", dob: "", bio: "", roles: []
        }
    });

    const [loading, setLoading] = useState(false);
    //for the contnent in the plot
    const [showModal, setShowModal] = useState(false);
    const [modalContent, setModalContent] = useState('');
    const [id, setId] = useState(null);

    // Filter Options
    const [filterOptions, setFilterOptions] = useState({});

    //For Handling Data Pagination
    const [tableData, setTableData] = useState([]);
    const [response, setRespose] = useState([]);
    const [actionItems, setActionItems] = useState([]);
    const [actionItemEnums, setActionItemactionItemEnums] = useState([]);
    const [genderEnum, setGenderEnum] = useState([]);
    const [genderOptions, setGenderOptions] = useState([]);
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
        const url = "persons/pagination";
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
        const url = `persons/action/items/${id}`;
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

    const getActionItemactionItemEnums = async () => {
        const url = `enums/actionItems`;
        setLoading(true);
        try {
            let result = await getData(url);
            setActionItemactionItemEnums(result);
        } catch (e) {
            toast.error(e.response.data.message);
        } finally {
            setLoading(false);
        }
    }

    const getFilterOptions = async () => {
        const url = `persons/filter/options`;
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

    const getGenderEnum = async () => {
        const url = `enums/sex`;
        setLoading(true);
        try {
            let result = await getData(url);
            let genderOption = Object.entries(result.gender.descriptions).map(([key, value]) => ({
                value: key,
                label: value
            }));
            setGenderOptions(genderOption);
            setGenderEnum(result);
        } catch (e) {
            toast.error(e.response.data.message);
        } finally {
            setLoading(false);
        }
    }

    const handleDelete = async (id) => {
        const url = `persons/${id}`;
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

    const processRoles = (roles) => {
        const roleNames = [];
        if (roles.isActor) roleNames.push("Actor");
        if (roles.isProducer) roleNames.push("Producer");
        return roleNames;
    };

    const getPersonForEdit = async (id) => {
        setId(id);
        const url = `persons/${id}`;
        setLoading(true);
        try {
            let result = await getData(url);
            if (result && Object.keys(result).length) {
                setValue("name", result.name);
                setValue("dob", result.dob);
                setValue("bio", result.bio);
                setValue("gender", genderOptions.find(option => option.value === result.gender));
                let roleArray = [];
                if (result.roles.isActor) {
                    roleArray.push("Actor");
                }
                if (result.roles.isProducer) {
                    roleArray.push("Producer");
                }
                setValue("roles", roleArray);
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
                dob: data.dob ? data.dob : null,
                bio: data.bio ? data.bio : null,
                gender: (data.gender && Object.keys(data.gender).length) ? data.gender.value : null,
                isActor: (data.roles && data.roles.length) ? data.roles.includes("Actor") : false,
                isProducer: (data.roles && data.roles.length) ? data.roles.includes("Producer") : false
            }
        }
        if (id) {
            setLoading(true);
            try {
                const url = `persons/${id}`
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
                const url = `persons/`
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
        getActionItemactionItemEnums();
        getGenderEnum();
        getFilterOptions();
    }, []);

    // Handlers for modal visibility
    const handleOpenModal = () => {
        setShow(true);
    };
    const handleCloseModal = () => {
        setShow(false);
        reset();
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
                                    <h4>Persons</h4>
                                </div>
                                <div className="d-flex align-items-center gap-2">
                                    <button className="btn btn-sm btn-primary" onClick={() => handleOpenModal()}>
                                        <span className="align-middle">Add Person</span>
                                    </button>
                                    <FilterComponent getData={getTableData} filterOptions={filterOptions} genderEnum={genderEnum} dateOfBirth={true} />
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
                                        <th className="sorting" onClick={(e) => tableSorting(e, 'gender')}>Gender</th>
                                        <th className="sorting" onClick={(e) => tableSorting(e, 'dob')}>DOB</th>
                                        <th className="sorting" onClick={(e) => tableSorting(e, 'bio')}>Bio</th>
                                        <th>Roles</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {tableData.length > 0 ? (
                                        tableData.map((record, i) => (
                                            <tr key={i}>
                                                <td>{record.name}</td>
                                                <td>{record.gender ? (genderEnum && Object.keys(genderEnum).length) ? genderEnum.gender.descriptions[record.gender] : "-" : "-"}</td>
                                                <td>{record.dob ? record.dob : "-"}</td>
                                                <td>{record.bio ? truncateText(record.bio, 15) : "-"}</td>
                                                <td>
                                                    <ul style={{ paddingLeft: "20px", margin: 0 }}>
                                                        {processRoles(record.roles).map((role, index) => (
                                                            <li key={index}>{role}</li>
                                                        ))}
                                                    </ul>
                                                </td>
                                                <td className="action-dropdown">
                                                    <div className="dropdown" onClick={() => getActionItems(record.id)}>
                                                        <a className="btn" type="button" data-bs-toggle="dropdown" aria-expanded="true">
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-three-dots" viewBox="0 0 16 16">
                                                                <path d="M3 9.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3m5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3m5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3" />
                                                            </svg>
                                                        </a>
                                                        <ul className="dropdown-menu dropdown-menu-end">
                                                            {actionItems.includes(actionItemEnums?.action?.EDIT) && (
                                                                <li>
                                                                    <a className="dropdown-item text-primary" onClick={() => { getPersonForEdit(record.id) }}>
                                                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-pen" viewBox="0 0 16 16">
                                                                            <path d="m13.498.795.149-.149a1.207 1.207 0 1 1 1.707 1.708l-.149.148a1.5 1.5 0 0 1-.059 2.059L4.854 14.854a.5.5 0 0 1-.233.131l-4 1a.5.5 0 0 1-.606-.606l1-4a.5.5 0 0 1 .131-.232l9.642-9.642a.5.5 0 0 0-.642.056L6.854 4.854a.5.5 0 1 1-.708-.708L9.44.854A1.5 1.5 0 0 1 11.5.796a1.5 1.5 0 0 1 1.998-.001m-.644.766a.5.5 0 0 0-.707 0L1.95 11.756l-.764 3.057 3.057-.764L14.44 3.854a.5.5 0 0 0 0-.708z" />
                                                                        </svg><span className="icon-text">Edit</span>
                                                                    </a>
                                                                </li>
                                                            )}
                                                            {actionItems.includes(actionItemEnums?.action?.DELETE) && (
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
                    {id ? (<Modal.Title>Edit Person</Modal.Title>) : (<Modal.Title>Add Person</Modal.Title>)}
                </Modal.Header>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <Modal.Body>
                        <div className="row">
                            {/* Left Column */}
                            <div className="col-md-6">
                                {/* Person Name */}
                                <div className="mb-3">
                                    <label htmlFor="name" className="form-label">
                                        Person Name
                                    </label>
                                    <Controller
                                        name="name"
                                        control={control}
                                        defaultValue=""
                                        rules={{ required: "Person name is required" }}
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

                                {/* Gender */}
                                <div className="mb-3">
                                    <label htmlFor="gender" className="form-label">
                                        Gender
                                    </label>
                                    <Controller
                                        name="gender"
                                        control={control}
                                        defaultValue=""
                                        rules={{ required: "Gender is required" }}
                                        render={({ field }) => (
                                            <Select
                                                id="gender"
                                                options={genderOptions}
                                                value={field.value}
                                                closeMenuOnSelect={true}
                                                onChange={field.onChange}
                                            />
                                        )}
                                    />
                                    {errors.gender && <div className="text-danger">{errors.gender.message}</div>}
                                </div>

                                <div className="mb-3">
                                    <label htmlFor="dob" className="form-label">
                                        Date of Birth
                                    </label>
                                    <Controller
                                        name="dob"
                                        control={control}
                                        defaultValue=""
                                        rules={{
                                            required: "Date of birth is required",
                                            validate: (value) => {
                                                const selectedDate = new Date(value);
                                                const today = new Date();
                                                if (selectedDate > today) {
                                                    return "Date of birth cannot be in the future";
                                                }
                                                return true;
                                            },
                                        }}
                                        render={({ field }) => (
                                            <input
                                                type="date"
                                                className="form-control"
                                                value={field.value}
                                                max={new Date().toISOString().split("T")[0]}
                                                id="dob"
                                                {...field}
                                            />
                                        )}
                                    />
                                    {errors.dob && <div className="text-danger">{errors.dob.message}</div>}
                                </div>

                                {/* Bio */}
                                <div className="mb-3">
                                    <label htmlFor="bio" className="form-label">
                                        Bio
                                    </label>
                                    <Controller
                                        name="bio"
                                        control={control}
                                        defaultValue=""
                                        rules={{ required: "Bio is required" }}
                                        render={({ field }) => (
                                            <textarea
                                                className="form-control"
                                                value={field.value}
                                                id="bio"
                                                {...field}
                                            />
                                        )}
                                    />
                                    {errors.bio && <div className="text-danger">{errors.bio.message}</div>}
                                </div>
                            </div>

                            {/* Right Column */}
                            <div className="col-md-6">
                                {/* Roles */}
                                <div className="mb-3">
                                    <label htmlFor="roles" className="form-label">
                                        Roles
                                    </label>
                                    <Controller
                                        name="roles"
                                        control={control}
                                        defaultValue={[]}
                                        rules={{ required: "At least one role is required" }}
                                        render={({ field }) => (
                                            <div id="roles">
                                                {/* Actor Checkbox */}
                                                <div className="form-check">
                                                    <input
                                                        type="checkbox"
                                                        id="actor"
                                                        value="Actor"
                                                        className="form-check-input"
                                                        checked={field.value.includes("Actor")}
                                                        onChange={(e) => {
                                                            const { checked, value } = e.target;
                                                            const newRoles = checked
                                                                ? [...field.value, value]
                                                                : field.value.filter((role) => role !== value);
                                                            field.onChange(newRoles);
                                                        }}
                                                    />
                                                    <label className="form-check-label" htmlFor="actor">
                                                        Actor
                                                    </label>
                                                </div>

                                                {/* Producer Checkbox */}
                                                <div className="form-check">
                                                    <input
                                                        type="checkbox"
                                                        id="producer"
                                                        value="Producer"
                                                        className="form-check-input"
                                                        checked={field.value.includes("Producer")}
                                                        onChange={(e) => {
                                                            const { checked, value } = e.target;
                                                            const newRoles = checked
                                                                ? [...field.value, value]
                                                                : field.value.filter((role) => role !== value);
                                                            field.onChange(newRoles);
                                                        }}
                                                    />
                                                    <label className="form-check-label" htmlFor="producer">
                                                        Producer
                                                    </label>
                                                </div>
                                            </div>
                                        )}
                                    />
                                    {errors.roles && <div className="text-danger">{errors.roles.message}</div>}
                                </div>
                            </div>
                        </div>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => handleCloseModal()}>
                            Close
                        </Button>
                        {id ? (
                            <Button type="submit" variant="primary">
                                Update
                            </Button>
                        ) : (
                            <Button type="submit" variant="primary">
                                Add
                            </Button>
                        )}
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

export default Persons;
