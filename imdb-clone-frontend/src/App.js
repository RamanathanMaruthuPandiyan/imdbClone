import React from "react";
import { Routes, Route } from 'react-router-dom';
import './assets/css/style.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import './assets/css/tablePagination.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import 'react-datepicker/dist/react-datepicker.css';
import Movies from "./pages/Movies";
import Header from "./components/Header";
import Jobs from "./pages/Jobs";
import Persons from "./pages/Persons";
import ImportFromImdb from "./pages/ImportFromImdb";

function App() {
  return (
    <div className="container">
      <div className="card">
        <Header />
        <Routes>
          <Route path="/" element={<Movies />} />
          <Route path="/persons" element={<Persons />} />
          <Route path="/import/from/imdb" element={<ImportFromImdb />} />
          <Route path="/jobs" element={<Jobs />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;