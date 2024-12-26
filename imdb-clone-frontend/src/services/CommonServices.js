import { useState, useCallback, useEffect } from 'react';
import debounce from 'lodash.debounce';

/**
   * Custom hook to manage Pagination
   * @param data
*/

export const usePagination = (data, dataLimit) => {
    const [selectedDataList, setSelectedDataList] = useState(dataLimit.limit);
    const [pagination, setPagination] = useState({ limit: dataLimit.limit, skip: dataLimit.skip, currentPage: 1, totalRecords: data.totalRecords });
    const [currentPage, setCurrentPage] = useState(1);
    const [paginationFunction, setPaginationFunction] = useState(1);

    const totalPages = Math.ceil(data.totalRecords / (selectedDataList < 1 ? 1 : selectedDataList));

    /* Handle page increment */
    const handleNextPage = useCallback(() => {
        if (currentPage < totalPages) {
            const newSkip = pagination.skip + selectedDataList;
            setPagination({ ...pagination, skip: newSkip, currentPage: currentPage + 1 });
            setCurrentPage(currentPage + 1);
            setPaginationFunction(paginationFunction + 1);
        }
    }, [currentPage, totalPages, pagination, selectedDataList, paginationFunction]);

    /* Handle page decrement */
    const handlePreviousPage = useCallback(() => {
        if (currentPage > 1) {
            const newSkip = pagination.skip - selectedDataList;
            setPagination({ ...pagination, skip: newSkip, currentPage: currentPage - 1 });
            setCurrentPage(currentPage - 1);
            setPaginationFunction(paginationFunction + 1);
        }
    }, [currentPage, pagination, selectedDataList, paginationFunction]);

    /* Function to handle input change */
    const handleChange = useCallback((e) => {
        let page = parseInt(e.target.value, 10) || 1;
        if (page < 1) page = 1;
        setSelectedDataList(page);
        setPagination({ limit: page, skip: 0, currentPage: 1, totalRecords: data.totalRecords });
        setCurrentPage(1);
        setPaginationFunction(paginationFunction + 1);
    }, [data.totalRecords, paginationFunction]);

    const debouncedHandleChange = useCallback(debounce(handleChange, 200), [handleChange]);

    useEffect(() => {
        return () => {
            debouncedHandleChange.cancel();
        };
    }, [debouncedHandleChange]);

    const handleInputChange = (e) => {
        debouncedHandleChange(e);
    };

    return { paginationFunction, handleNextPage, handlePreviousPage, handleInputChange, totalPages, pagination, setPagination, selectedDataList, setSelectedDataList, currentPage, setCurrentPage }
}

/**
   * Custom hook to manage Filter
   * @param data
*/
export const useFilter = () => {
    const [filter, setFilter] = useState({});

    const loadFilterOption = useCallback((event, value, scope) => {
        const { checked } = event.target;
        setFilter(prevFilters => {
            const updatedFilters = { ...prevFilters };

            if (!updatedFilters[scope]) {
                updatedFilters[scope] = [];
            }

            if (checked) {
                updatedFilters[scope].push(value);
            } else {
                updatedFilters[scope] = updatedFilters[scope].filter(item => item !== value);
                if (updatedFilters[scope].length === 0) {
                    delete updatedFilters[scope];
                }
            }
            return updatedFilters;
        });
    }, []);

    const loadDateFilter = useCallback((selectedDate, scope) => {
        setFilter(prevFilters => {
            const updatedFilters = { ...prevFilters };
            updatedFilters[scope] = selectedDate;

            return updatedFilters;
        });
    }, []);

    const clearSelectedFilter = useCallback((scope) => {
        setFilter(prevFilters => {
            const updatedFilters = { ...prevFilters };
            delete updatedFilters[scope];
            return updatedFilters;
        });
    }, []);

    const clearAllFilter = useCallback(() => {
        const checkboxes = document.querySelectorAll('.filter-container input[type="checkbox"], .filter-container input[type="radio"]');
        checkboxes.forEach(checkbox => {
            checkbox.checked = false;
        });
        setFilter({});
    }, []);

    return { loadFilterOption, clearSelectedFilter, clearAllFilter, loadDateFilter, filter, setFilter };
};

// Custom hook to manage Sorting
export const useSorting = () => {
    const [sortingData, setSortingData] = useState({});

    const tableSorting = useCallback((e, modelName) => {
        const thElements = document.querySelectorAll('th.sorting');
        const thisEvent = e.target;
        const currentSort = thisEvent.dataset.sort;

        thElements.forEach(th => {
            th.classList.remove('ascending', 'descending');
            th.removeAttribute('data-sort');
        });

        const newSort = currentSort === '1' ? '-1' : '1';
        thisEvent.dataset.sort = newSort;
        thisEvent.classList.add(newSort === '1' ? 'ascending' : 'descending');

        setSortingData({ [modelName]: parseInt(newSort) });
    }, []);

    return { tableSorting, sortingData };

}
