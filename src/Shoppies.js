import React, {Component} from 'react';
import { ToastContainer, toast, Slide } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {Spin} from 'antd';
import 'antd/dist/antd.css';

export default class ParentComponent extends Component {
    constructor(props) {
        super(props);

        this.searchMovies = this.searchMovies.bind(this);
        this.getMovies = this.getMovies.bind(this);
        this.getNominations = this.getNominations.bind(this);
        this.nominateMovie = this.nominateMovie.bind(this);
        this.removeNomination = this.removeNomination.bind(this);
        this.searchClicked = this.searchClicked.bind(this);

        this.state = {
            results: [],
            nominations: [],
            loading: false,
            error: false
        };
    }

    async searchMovies(value) {
        if(value === "" || value === " ") {
            this.setState({ 
                error: false,
                loading: false,
                results: []
            })
            return;
        }

        this.setState({ loading: true })
        if(value[value.length-1] === ' ') value = value.substring(0, value.length - 1);
        value = value.split(' ').join('+');
        
        try {
            const search = await fetch(`https://www.omdbapi.com/?s=${value}*&apikey=c1de8374`);
            const response = await search.json();

            if (response.Response === 'False') {
                this.setState({
                    results: [],
                    loading: false,
                    error: true
                })
                return;
            }
            
            let movies = [];
            response.Search.forEach(async (movie) => {
                const id = movie["imdbID"];
                if(this.state.nominations.includes(id)) movie["Nominated"] = true;
                else movie["Nominated"] = false;

                try {
                    const details = await fetch(`https://www.omdbapi.com/?i=${id}&apikey=c1de8374`);
                    const res = await details.json();

                    if (res.Response === 'False') {
                        movie["Runtime"] = "N/A";
                        movie["Genre"] = "N/A";
                        movie["Director"] = "N/A";
                        movie["Actors"] = "N/A";
                        movie["Awards"] = "N/A";
                    }
                    else {
                        movie["Runtime"] = res.Runtime;
                        movie["Genre"] = res.Genre;
                        movie["Director"] = res.Director;
                        movie["Actors"] = res.Actors;
                        movie["Awards"] = res.Awards;
                    }
                    movies.push(movie);

                } catch (e) {
                    movie["Runtime"] = "N/A";
                    movie["Genre"] = "N/A";
                    movie["Director"] = "N/A";
                    movie["Actors"] = "N/A";
                    movie["Awards"] = "N/A";
                    movies.push(movie);

                } finally {
                    if(movies.length === response.Search.length) {
                        this.setState({
                            loading: false,
                            error: false,
                            results: movies
                        })
                    }
                }
            });

        } catch (e) {
            this.setState({
                results: [],
                loading: false,
                error: true
            })
        }
    }

    handleChange = (e) => {
        if (e.key === 'Enter') {
            this.searchMovies(e.target.value);
        }
    }

    searchClicked() {
        this.searchMovies(document.getElementById("search-value").value);
    }

    nominateMovie(movie) {
        if(this.state.nominations.length === 5) {
            toast("Hold on! You have already selected 5 nominations!", {
                position: "top-center",
                transition: Slide,
                autoClose: 4000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                });
        }
        else if(!this.state.nominations.includes(movie.id)) {
            let nominated = this.state.nominations;
            nominated.push({
                id: movie["imdbID"],
                Title: movie.Title,
                Year: movie.Year,
                Poster: movie.Poster
            });
            this.setState({
                nominations: nominated
            })
            if(nominated.length === 5) {
                toast("Congrats! You have selected 5 nominations!", {
                    position: "top-center",
                    transition: Slide,
                    autoClose: 4000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                    });
            }
        }
    }

    removeNomination(moveId) {
        let nominated = this.state.nominations;
        nominated = nominated.filter(function(movie) {
            return movie.id !== moveId;
        });
        this.setState({
            nominations: nominated
        })
    }

    getMovies() {
        if (this.state.error) return(<div className="mt-3 text-center error">Please refine your search.</div>);

        let movies = [];
        for(let i = 0; i<this.state.results.length; i++) {
            let nominated = this.state.nominations.filter(e => e.id === this.state.results[i]["imdbID"]).length > 0;
            movies.push(
                <div key={i} className="movie-card d-flex align-items-center">
                    {this.state.results[i].Poster !== "N/A" ? <img src={this.state.results[i].Poster} className="movie-poster" alt={"Movie Poster of "+this.state.results[i].Title} /> : null}
                    <div>
                        <div className="movie-title-card">
                            {this.state.results[i].Title} ({this.state.results[i].Year})
                        </div>
                        <div className="movie-desc-card">
                            {this.state.results[i].Runtime !== "N/A" ? <div>Runtime: {this.state.results[i].Runtime}<br/></div> : null}
                            {this.state.results[i].Genre !== "N/A" ? <div>Genre: {this.state.results[i].Genre}<br/></div> : null}
                            {this.state.results[i].Director !== "N/A" ? <div>Director: {this.state.results[i].Director}<br/></div> : null}
                            {this.state.results[i].Actors !== "N/A" ? <div>Actors: {this.state.results[i].Actors}<br/></div> : null}
                            {this.state.results[i].Awards !== "N/A" ? <div>Awards: {this.state.results[i].Awards}<br/></div> : null}
                        </div>
                        
                        { nominated ? 
                            <div className={"movie-btn-card movie-btn-card-nom"}>Nominated</div> :
                            <div className={"movie-btn-card"} onClick={() => this.nominateMovie(this.state.results[i])}>Nominate</div>
                        }
                    </div>
                </div>
            )
        }
        return (<div id="movie-flex" className="row d-inline-flex flex-wrap">{movies}</div>);
    }

    getNominations() {
        let nominations = [];
        for(let i = 0; i<this.state.nominations.length; i++) {
            let movie = this.state.nominations[i];
            nominations.push(
                <div key={i} className="nomination-container">
                    { movie.Poster !== "N/A" ?
                        <img src={movie.Poster} className="nomination-poster" alt={"Movie Poster of "+movie.Title} /> :
                        <div className="nomination-poster nomination-no-poster">{movie.Title}</div>
                    }
                    <div className="middle">
                        <div className="text">{movie.Title} ({movie.Year})</div>
                        <div className="remove" onClick={() => this.removeNomination(movie.id)}>Remove</div>
                    </div>
                </div>
            );
        }
        return (<div id="nominations-flex" className="row d-inline-flex flex-wrap justify-content-center">{nominations}</div>);
    }

    render() {
        return (
            <div id="app">
                <div id="movie-search" className="d-flex flex-column">
                    <div id="header" className="text-center">
                        <div id="title">The Shoppies</div>
                        <div id="desc">Movie awards for entrepreneurs. Select 5 films that you would like to nominate.</div>
                        <div className="d-flex justify-content-center align-items-center search-flex">
                            <input type="text" id="search-value" placeholder="Movie Title..." onKeyDown={this.handleChange} />
                            <img src="search-icon.png" className="search-icon" onClick={this.searchClicked} alt="Search Button" />
                        </div>
                    </div>
                    <div id="results" className="flex-grow-1">
                        { this.state.loading ? <div className="text-center spinner"><Spin size="large" /></div> : this.getMovies() }
                    </div>
                </div>
                <div id="nominations" className="text-center">
                    <div id="nominations-title">Nominations ({this.state.nominations.length})</div>
                    { this.getNominations() }
                </div>
                <ToastContainer style={{ width: "400px" }} />
            </div>
        );
    }
}
