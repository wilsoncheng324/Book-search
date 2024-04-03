import { useState, useEffect } from 'react';
import { Jumbotron, Container, Col, Form, Button, Card, CardColumns } from 'react-bootstrap';

import Auth from '../utils/auth';
import { searchGoogleBooks } from '../utils/API';
import { saveBookIds, getSavedBookIds } from '../utils/localStorage';
import { SAVE_BOOK } from '../utils/mutations';
import { useMutation } from "@apollo/client";

const SearchBooks = () => {
  // create state for holding returned google api data
  const [searchedBooks, setSearchedBooks] = useState([]);
  // create state for holding our search field data
  const [searchInput, setSearchInput] = useState('');

  // create state to hold saved bookId values
  const [savedBookIds, setSavedBookIds] = useState(getSavedBookIds());

  // set up useEffect hook to save `savedBookIds` list to localStorage on component unmount
  // learn more here: https://reactjs.org/docs/hooks-effect.html#effects-with-cleanup

  const [saveBook, { error }] = useMutation(SAVE_BOOK);

  useEffect(() => {
    return () => saveBookIds(savedBookIds);
  });

  // create method to search for books and set state on form submit
  const handleFormSubmit = async (event) => {
    event.preventDefault();

    if (!searchInput) {
      return false;
    }

    try {
      // convert to mongo syntax
      const response = await searchGoogleBooks(searchInput);

      if (!response.ok) {
        throw new Error('something went wrong!');
      }

      const { items } = await response.json();

      const bookData = items.map((book) => ({
        bookId: book.id,
        authors: book.volumeInfo.authors || ['No author to display'],
        title: book.volumeInfo.title,
        description: book.volumeInfo.description,
        image: book.volumeInfo.imageLinks?.thumbnail || '',
      }));

      setSearchedBooks(bookData);
      setSearchInput('');
    } catch (err) {
      console.error(err);
    }
  };

  // create function to handle saving a book to our database
  const handleSaveBook = async (bookId) => {
    // find the book in `searchedBooks` state by the matching id
    const bookToSave = searchedBooks.find((book) => book.bookId === bookId);

    // get token
    const token = Auth.loggedIn() ? Auth.getToken() : null;

    if (!token) {
      return false;
    }

    try {
      const response = await saveBook(bookToSave, token);

      if (!response.ok) {
        throw new Error('something went wrong!');
      }

      // if book successfully saves to user's account, save book id to state
      setSavedBookIds([...savedBookIds, bookToSave.bookId]);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      <Jumbotron fluid className='text-light bg-dark'>
        <Container>
          <h1>Search for Books!</h1>
          <Form onSubmit={handleFormSubmit}>
            <Form.Row>
              <Col xs={12} md={8}>
                <Form.Control
                  name='searchInput'
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  type='text'
                  size='lg'
                  placeholder='Search for a book'
                />
              </Col>
              <Col xs={12} md={4}>
                <Button type='submit' variant='success' size='lg'>
                  Submit Search
                </Button>
              </Col>
            </Form.Row>
          </Form>
        </Container>
      </Jumbotron>

      <Container>
        <h2>
          {searchedBooks.length
            ? `Viewing ${searchedBooks.length} results:`
            : 'Search for a book to begin'}
        </h2>
        <CardColumns>
          {searchedBooks.map((book) => {
            return (
              <Card key={book.bookId} border='dark'>
                {book.image ? (
                  <Card.Img src={book.image} alt={`The cover for ${book.title}`} variant='top' />
                ) : null}
                <Card.Body>
                  <Card.Title>{book.title}</Card.Title>
                  <p className='small'>Authors: {book.authors}</p>
                  <Card.Text>{book.description}</Card.Text>
                  {Auth.loggedIn() && (
                    <Button
                      disabled={savedBookIds?.some((savedBookId) => savedBookId === book.bookId)}
                      className='btn-block btn-info'
                      onClick={() => handleSaveBook(book.bookId)}>
                      {savedBookIds?.some((savedBookId) => savedBookId === book.bookId)
                        ? 'This book has already been saved!'
                        : 'Save this Book!'}
                    </Button>
                  )}
                </Card.Body>
                {error && (
              <div className="my-3 p-3 bg-danger text-white">
                {error.message}
                </div>
                )}
              </Card>
            );
          })}
        </CardColumns>
      </Container>
    </>
  );
};

export default SearchBooks;


// import React from 'react';
// // import { Jumbotron, Container, CardColumns, Card, Button } from 'react-bootstrap';

// import { GET_ME } from '../utils/queries';
// import { REMOVE_BOOK } from '../utils/mutations';
// import Auth from '../utils/auth';
// import { removeBookId } from '../utils/localStorage';
// import { useMutation, useQuery } from "@apollo/client";

// const SavedBooks = () => {
//   const { loading, data } = useQuery(GET_ME);
//   let userData = data?.me || {};
//   console.log(userData);
//   const [removeBook] = useMutation(REMOVE_BOOK);

//    // create function that accepts the book's mongo _id value as param and deletes the book from the database
//   const handleDeleteBook = async (bookId) => {
//     const token = Auth.loggedIn() ? Auth.getToken() : null;

//     if (!token) {
//       return false;
//     }

//     try {
//       // convert to mongo syntax
//       await removeBook({variables: { bookId: bookId, }});
//       removeBookId(bookId);
//     } catch (err) {
//       console.error(err);
//     }
//   };

//   // if data isn't here yet, say so
//   if (loading) {
//     return <div>Loading...</div>;
//   }

//   return (
//     <>
//       <Jumbotron fluid className='text-light bg-dark'>
//         <Container>
//           <h1>Viewing saved books!</h1>
//         </Container>
//       </Jumbotron>
//       <Container>
//         <h2>
//           {userData.savedBooks.length
//             ? `Viewing ${userData.savedBooks.length} saved ${userData.savedBooks.length === 1 ? 'book' : 'books'}:`
//             : 'You have no saved books!'}
//         </h2>
//         <CardColumns>
//           {userData.savedBooks.map((book) => {
//             return (
//               <Card key={book.bookId} border='dark'>
//                 {book.image ? <Card.Img src={book.image} alt={`The cover for ${book.title}`} variant='top' /> : null}
//                 <Card.Body>
//                   <Card.Title>{book.title}</Card.Title>
//                   <p className='small'>Authors: {book.authors}</p>
//                   <Card.Text>{book.description}</Card.Text>
//                   <Button className='btn-block btn-danger' onClick={() => handleDeleteBook(book.bookId)}>
//                     Delete this Book!
//                   </Button>
//                 </Card.Body>
//               </Card>
//             );
//           })}
//         </CardColumns>
//       </Container>
//     </>
//   );
// };

// export default SavedBooks;


// // import { useState, useEffect } from 'react';
// // import {
// //   Container,
// //   Col,
// //   Form,
// //   Button,
// //   Card,
// //   Row
// // } from 'react-bootstrap';

// // import Auth from '../utils/auth';
// // import { saveBook, searchGoogleBooks } from '../utils/API';
// // import { saveBookIds, getSavedBookIds } from '../utils/localStorage';

// // const SearchBooks = () => {
// //   // create state for holding returned google api data
// //   const [searchedBooks, setSearchedBooks] = useState([]);
// //   // create state for holding our search field data
// //   const [searchInput, setSearchInput] = useState('');

// //   // create state to hold saved bookId values
// //   const [savedBookIds, setSavedBookIds] = useState(getSavedBookIds());

// //   // set up useEffect hook to save `savedBookIds` list to localStorage on component unmount
// //   // learn more here: https://reactjs.org/docs/hooks-effect.html#effects-with-cleanup
// //   useEffect(() => {
// //     return () => saveBookIds(savedBookIds);
// //   });

// //   // create method to search for books and set state on form submit
// //   const handleFormSubmit = async (event) => {
// //     event.preventDefault();

// //     if (!searchInput) {
// //       return false;
// //     }

// //     try {
// //       const response = await searchGoogleBooks(searchInput);

// //       if (!response.ok) {
// //         throw new Error('something went wrong!');
// //       }

// //       const { items } = await response.json();

// //       const bookData = items.map((book) => ({
// //         bookId: book.id,
// //         authors: book.volumeInfo.authors || ['No author to display'],
// //         title: book.volumeInfo.title,
// //         description: book.volumeInfo.description,
// //         image: book.volumeInfo.imageLinks?.thumbnail || '',
// //       }));

// //       setSearchedBooks(bookData);
// //       setSearchInput('');
// //     } catch (err) {
// //       console.error(err);
// //     }
// //   };

// //   // create function to handle saving a book to our database
// //   const handleSaveBook = async (bookId) => {
// //     // find the book in `searchedBooks` state by the matching id
// //     const bookToSave = searchedBooks.find((book) => book.bookId === bookId);

// //     // get token
// //     const token = Auth.loggedIn() ? Auth.getToken() : null;

// //     if (!token) {
// //       return false;
// //     }

// //     try {
// //       const response = await saveBook(bookToSave, token);

// //       if (!response.ok) {
// //         throw new Error('something went wrong!');
// //       }

// //       // if book successfully saves to user's account, save book id to state
// //       setSavedBookIds([...savedBookIds, bookToSave.bookId]);
// //     } catch (err) {
// //       console.error(err);
// //     }
// //   };

// //   return (
// //     <>
// //       <div className="text-light bg-dark p-5">
// //         <Container>
// //           <h1>Search for Books!</h1>
// //           <Form onSubmit={handleFormSubmit}>
// //             <Row>
// //               <Col xs={12} md={8}>
// //                 <Form.Control
// //                   name='searchInput'
// //                   value={searchInput}
// //                   onChange={(e) => setSearchInput(e.target.value)}
// //                   type='text'
// //                   size='lg'
// //                   placeholder='Search for a book'
// //                 />
// //               </Col>
// //               <Col xs={12} md={4}>
// //                 <Button type='submit' variant='success' size='lg'>
// //                   Submit Search
// //                 </Button>
// //               </Col>
// //             </Row>
// //           </Form>
// //         </Container>
// //       </div>

// //       <Container>
// //         <h2 className='pt-5'>
// //           {searchedBooks.length
// //             ? `Viewing ${searchedBooks.length} results:`
// //             : 'Search for a book to begin'}
// //         </h2>
// //         <Row>
// //           {searchedBooks.map((book) => {
// //             return (
// //               <Col md="4" key={book.bookId}>
// //                 <Card border='dark'>
// //                   {book.image ? (
// //                     <Card.Img src={book.image} alt={`The cover for ${book.title}`} variant='top' />
// //                   ) : null}
// //                   <Card.Body>
// //                     <Card.Title>{book.title}</Card.Title>
// //                     <p className='small'>Authors: {book.authors}</p>
// //                     <Card.Text>{book.description}</Card.Text>
// //                     {Auth.loggedIn() && (
// //                       <Button
// //                         disabled={savedBookIds?.some((savedBookId) => savedBookId === book.bookId)}
// //                         className='btn-block btn-info'
// //                         onClick={() => handleSaveBook(book.bookId)}>
// //                         {savedBookIds?.some((savedBookId) => savedBookId === book.bookId)
// //                           ? 'This book has already been saved!'
// //                           : 'Save this Book!'}
// //                       </Button>
// //                     )}
// //                   </Card.Body>
// //                 </Card>
// //               </Col>
// //             );
// //           })}
// //         </Row>
// //       </Container>
// //     </>
// //   );
// // };

// // export default SearchBooks;
