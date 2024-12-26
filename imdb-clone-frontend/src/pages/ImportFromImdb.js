import React, { useEffect, useState } from "react";
import { Button } from "react-bootstrap";
import { ToastContainer, toast } from "react-toastify";
import { useForm, Controller } from 'react-hook-form';
import { postData, getData } from "../services/ApiServices.js";
import Loader from "../components/Loader";

const ImportFromImdb = () => {
    const [loading, setLoading] = useState(false);
    const [tableData, setTableData] = useState([]);

    const [searchTerm, setSearchTerm] = useState(null);
    const [limit, setLimit] = useState(10);

    const { handleSubmit, control } = useForm({
        defaultValues: {
            search: '',
            limit: 10,
        },
    });

    const onSubmit = async (data) => {
        const url = "movies/imdb/search";
        setLoading(true);
        try {
            let params = {
                searchTerm: data.search,
                limit: data.limit
            }
            const result = await getData(url, { params });
            setTableData(result);

        } catch (e) {
            toast.error(e.response.data.message);
        } finally {
            setLoading(false);
        }
    };

    const handleImport = async (record) => {
        const url = "movies/imdb/import";
        setLoading(true);
        try {
            let obj = {
                imdbId: record.imdbId,
                name: record.name,
                yearOfRelease: record.yearOfRelease,
                poster: record.poster,
                actors: record.actors
            }

            let result = await postData(url, obj);
            let data = {
                search: searchTerm,
                limit: limit
            }
            onSubmit(data)
            toast.success(result);
        } catch (e) {
            toast.error(e.response.data.message);
        } finally {
            setLoading(false);
        }
    }

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
                                    <h4>Import From IMDB</h4>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div>
                        <form className="inline-form" onSubmit={handleSubmit(onSubmit)}>
                            <div className="form-field">
                                <label className="form-label" htmlFor="search">Search</label>
                                <Controller
                                    name="search"
                                    control={control}
                                    render={({ field }) => (
                                        <input
                                            {...field}
                                            id="search"
                                            type="text"
                                            placeholder="Search"
                                            className="input-field"
                                            onChange={(e) => {
                                                field.onChange(e); // Updates the Controller's internal state
                                                setSearchTerm(e.target.value); // Updates your local state
                                            }}
                                        />
                                    )}
                                />
                            </div>
                            <div className="form-field">
                                <label className="form-label" htmlFor="limit">Limit</label>
                                <Controller
                                    name="limit"
                                    control={control}
                                    render={({ field }) => (
                                        <input
                                            {...field}
                                            id="limit"
                                            type="number"
                                            placeholder="Set Limit"
                                            className="input-field"
                                            onChange={(e) => {
                                                field.onChange(e); // Updates the Controller's internal state
                                                setLimit(e.target.value); // Updates your local state
                                            }}
                                        />
                                    )}
                                />
                            </div>
                            <div className="form-field">
                                <button type="submit" className="submit-button">
                                    Submit
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Table Section */}
                    <div className="row mt-3">
                        <div className="col">
                            <table className="table table-bordered table-hover">
                                <thead className="table-primary">
                                    <tr>
                                        <th>Poster</th>
                                        <th >Name</th>
                                        <th >Year of Release</th>
                                        <th >Actors</th>
                                        <th >Producers</th>
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
                                                <td>{(record.actors && record.actors.length) ? record.actors.map((act) => act.name).join(", ") : "-"}</td>
                                                <td>{(record.producers && record.producers.length) ? record.producers.map((prod) => prod.name).join(", ") : "-"}</td>
                                                <td className="text-center">
                                                    {record.isImportAllowed ? (<Button variant="primary" className="me-2" onClick={() => handleImport(record)}>Import</Button>) : (<Button variant="primary" disabled className="me-2">Import</Button>)}
                                                </td>

                                            </tr>))
                                    ) : (
                                        <tr>
                                            <td colSpan="8" className='text-center'>No Records Found</td>
                                        </tr>
                                    )}

                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div >
        </div >
    );
};

export default ImportFromImdb;
