import React from "react";
import { Navbar, Nav, Container, Image, Button } from "react-bootstrap";
import { NavLink } from "react-router-dom"; // Import NavLink
import { useAppContext } from '../keycloak/InitiateKeycloak.js';

const Header = () => {
    const { keycloak } = useAppContext();

    const logout = () => {
        keycloak.logout();
    }
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
                    <Nav className="ms-auto d-flex align-items-center text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-person-circle me-2" viewBox="0 0 16 16">
                            <path d="M11 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0" />
                            <path fillRule="evenodd" d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8m8-7a7 7 0 0 0-5.468 11.37C3.242 11.226 4.805 10 8 10s4.757 1.225 5.468 2.37A7 7 0 0 0 8 1" />
                        </svg>
                        <span className="me-3">{keycloak?.tokenParsed?.preferred_username?.toUpperCase()}</span>
                        <Button className="btn btn-sm btn-primary text-white"
                            variant="outline-dark"
                            onClick={() => logout()}
                        >
                            Logout
                        </Button>
                    </Nav>
                </Navbar.Collapse>
            </Container>
        </Navbar>
    );
};

export default Header;