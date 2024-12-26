import React from 'react';
import Wedges from "../assets/images/Wedges.svg";

function Loader({ loading }) {
    return (
        <>
            {loading &&
                <div className="loader-container">
                    <img src={Wedges} width="250px" />
                </div>
            }
        </>
    )
}

export default Loader;