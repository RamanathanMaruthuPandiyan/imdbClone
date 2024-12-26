import React from "react";
import { Navbar, Nav, Container } from "react-bootstrap";
import { NavLink } from "react-router-dom"; // Import NavLink

const Header = () => {
    return (
        <Navbar expand="lg">
            <Container>
                <Navbar.Brand href="#"><h5 className="italic-text">IMDB CLONE</h5></Navbar.Brand>
                <Navbar.Toggle aria-controls="basic-navbar-nav" />
                <Navbar.Collapse id="basic-navbar-nav">
                    <Nav className="me-auto">
                        <Nav.Link as={NavLink} to="/" active className="active-link">
                            <h6>Movies</h6>
                        </Nav.Link>
                        <Nav.Link as={NavLink} to="/persons" active className="active-link">
                            <h6>Persons</h6>
                        </Nav.Link>
                        <Nav.Link as={NavLink} to="/import/from/imdb" active className="active-link">
                            <h6>Import From IMDB</h6>
                        </Nav.Link>
                        <Nav.Link as={NavLink} to="/jobs" active className="active-link">
                            <h6>Jobs</h6>
                        </Nav.Link>
                    </Nav>
                </Navbar.Collapse>
            </Container>
        </Navbar>
    );
};

export default Header;