import React, { useState } from "react";
import { Button } from "react-bootstrap";
import { useFilter } from "../services/CommonServices";

const FilterComponent = ({ getData, filterOptions, dateOfBirth = false, genderEnum = {} }) => {
    const [showFilter, setShowFilter] = useState(false);
    const [date, setDate] = useState(null);

    const toggleFilter = () => setShowFilter(!showFilter);
    const [isGetFilterCalled, setIsGetFilterCalled] = useState(false);

    const { loadFilterOption, clearAllFilter, filter, loadDateFilter } = useFilter();

    const getFilters = (filter) => {
        toggleFilter();
        setIsGetFilterCalled(true);
        if (Object.keys(filter).length) {
            sessionStorage.setItem('filter', JSON.stringify(filter));
        } else {
            sessionStorage.removeItem('filter');
        }

        setTimeout(function () {
            getData(true);
        });
    }

    const clearTableData = () => {
        toggleFilter();
        clearAllFilter();
        sessionStorage.removeItem('filter');
        getData(true);
        setDate(null);
    }

    return (
        <div>
            <Button className="custom-filter-btn btn-sm" onClick={toggleFilter}>
                {
                    (filter && Object.keys(filter).length && isGetFilterCalled) ?
                        (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-funnel-fill" viewBox="0 0 16 16">
                            <path d="M1.5 1.5A.5.5 0 0 1 2 1h12a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-.128.334L10 8.692V13.5a.5.5 0 0 1-.342.474l-3 1A.5.5 0 0 1 6 14.5V8.692L1.628 3.834A.5.5 0 0 1 1.5 3.5z" />
                        </svg>) :
                        (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-funnel" viewBox="0 0 16 16">
                            <path d="M1.5 1.5A.5.5 0 0 1 2 1h12a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-.128.334L10 8.692V13.5a.5.5 0 0 1-.342.474l-3 1A.5.5 0 0 1 6 14.5V8.692L1.628 3.834A.5.5 0 0 1 1.5 3.5zm1 
                    .5v1.308l4.372 4.858A.5.5 0 0 1 7 8.5v5.306l2-.666V8.5a.5.5 0 0 1 .128-.334L13.5 3.308V2z" />
                        </svg>)
                }

            </Button>

            {/* Filter Overlay */}
            {showFilter && (
                <div className="filter-overlay">
                    <div className="filter-panel">
                        <div className="filter-header">
                            <h5>Filter Options</h5>
                            <button className="close-btn" onClick={toggleFilter}>
                                &times;
                            </button>
                        </div>
                        <div className="filter-body">
                            {dateOfBirth && <div className="mb-3">
                                <h6>Date of Birth</h6>
                                <input
                                    type="date"
                                    value={date}
                                    onChange={(e) => { loadDateFilter(e.target.value, "dob"); setDate(e.target.value); }}
                                    className="form-control"
                                />
                            </div>}

                            {filterOptions && Object.keys(filterOptions).map((filterKey) => {
                                const filterData = filterOptions[filterKey];
                                return (
                                    <div key={filterKey} className="mb-3">
                                        <h6>{filterData?.displayName}</h6>
                                        {filterData && filterData.options?.length && filterData.options.map((option, index) => (
                                            <div key={index} className="custom-checkbox">
                                                <input
                                                    type="checkbox"
                                                    id={`${filterKey}-${index}`}
                                                    value={option}
                                                    checked={filter[filterKey]?.includes(option) || false}
                                                    onChange={(e) => loadFilterOption(e, option, `${filterKey}`)}
                                                />
                                                {filterData && filterData.isGender ? (<label htmlFor={`${filterKey}`}>{(genderEnum && Object.keys(genderEnum).length) ? genderEnum.gender.descriptions[option] || "Null" : "Null"}</label>) : (<label htmlFor={`${filterKey}`}>{option}</label>)}

                                            </div>
                                        ))}
                                    </div>
                                );
                            })}
                        </div>
                        <div className="filter-footer">
                            <Button variant="secondary" onClick={() => { clearTableData(); }}>
                                Clear Filters
                            </Button>
                            <Button variant="primary" onClick={() => getFilters(filter)}>Apply Filters</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FilterComponent;
