import React, {Component} from 'react';
import { ToastContainer, toast, Slide } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {Spin} from 'antd';
import 'antd/dist/antd.css';

export default class ParentComponent extends Component {
    constructor(props) {
        super(props);

        this.getMovies = this.getMovies.bind(this);
        this.getNominations = this.getNominations.bind(this);
        this.nominateMovie = this.nominateMovie.bind(this);
        this.removeNomination = this.removeNomination.bind(this);

        this.state = {
            results: [],
            nominations: [],
            loading: false,
            error: false
        };
    }

    handleChange = (e) => {
        let value = e.target.value;
        // When search input changed, check if input empty/only contains spaces
        if(value !== "" && value.replace(/\s/g, '').length) {
            this.setState({ loading: true })
            fetch(`http://www.omdbapi.com/?s=${value}*&apikey=${process.env.key}`)
            .then(resp => resp.json())
            .then(response => {
                if (response.Response === 'False') {
                    console.log(response.Error);
                    this.setState({
                        results: [],
                        loading: false,
                        error: true
                    })
                }
                else {
                    let movies = [];
                    response.Search.forEach(movie => {
                        const id = movie["imdbID"];
                        if(this.state.nominations.includes(id)) movie["Nominated"] = true;
                        else movie["Nominated"] = false;

                        fetch(`http://www.omdbapi.com/?i=${id}&apikey=${process.env.key}`)
                        .then(resp => resp.json())
                        .then(res => {
                            if (res.Response === 'False') {
                                movie["Runtime"] = "";
                                movie["Genre"] = "";
                                movie["Director"] = "";
                                movie["Actors"] = "";
                                movie["Awards"] = "";
                            }
                            else {
                                movie["Runtime"] = res.Runtime;
                                movie["Genre"] = res.Genre;
                                movie["Director"] = res.Director;
                                movie["Actors"] = res.Actors;
                                movie["Awards"] = res.Awards;
                            }
                            movies.push(movie);
                            this.setState({
                                results: movies,
                                loading: false,
                                error: false
                            })
                        })
                    });
                }
            })
        }
        else {
            this.setState({ error: false })
        }
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
        else if(this.state.nominations.filter(item => item.id === movie["imdbID"]).length == 0) {
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
            let nominated = this.state.nominations.filter(e => e.id === this.state.results[i]["imdbID"]).length === 0;
            movies.push(
                <div key={i} className="movie-card d-flex align-items-center">
                    {this.state.results[i].Poster !== "N/A" ? <img src={this.state.results[i].Poster} className="movie-poster" alt={"Movie Poster of "+this.state.results[i].Title} /> : null}
                    <div>
                        <div className="movie-title-card">
                            {this.state.results[i].Title} ({this.state.results[i].Year})
                        </div>
                        <div className="movie-desc-card">
                            Runtime: {this.state.results[i].Runtime}<br/>
                            Genre: {this.state.results[i].Genre}<br/>
                            Director: {this.state.results[i].Director}<br/>
                            Actors: {this.state.results[i].Actors}<br />
                            Awards: {this.state.results[i].Awards}
                        </div>
                        
                        { nominated ? 
                            <div className={"movie-btn-card"} onClick={() => this.nominateMovie(this.state.results[i])}>Nominate</div> :
                            <div className={"movie-btn-card movie-btn-card-nom"}>Nominated</div>
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
                        <input type="text" placeholder="Movie Title..." onChange={this.handleChange} />
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
