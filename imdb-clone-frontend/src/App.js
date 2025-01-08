import React from "react";
import { Routes, Route, BrowserRouter } from 'react-router-dom';
import './assets/css/style.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import './assets/css/tablePagination.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import Movies from "./pages/Movies";
import Header from "./components/Header";
import Jobs from "./pages/Jobs";
import Persons from "./pages/Persons";
import ImportFromImdb from "./pages/ImportFromImdb";

function App() {
  return (
    <div className="container">
      <div className="card">
        <BrowserRouter>
          <Header />
          <Routes>
            <Route path="/" element={<Movies />} />
            <Route path="/persons" element={<Persons />} />
            <Route path="/import/from/imdb" element={<ImportFromImdb />} />
            <Route path="/jobs" element={<Jobs />} />
          </Routes>
        </BrowserRouter>
      </div>
    </div>
  );
}

export default App;