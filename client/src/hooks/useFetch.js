import { useReducer, useEffect } from 'react';
import axios from 'axios';

const dataFetchReducer = (state, action) => {
  switch (action.type) {
    case 'FETCH_DATA':
      return {
        data: action.payload,
        isLoading: false,
        isError: false,
        initialLoad: false,
      };
    case 'ADD_DATA':
      return {
        data: state.data.concat(action.payload),
        isLoading: false,
        isError: false,
      };
    case 'UPDATE_DATA':
      return {
        data: state.data.map(x => (x.id === action.id ? action.payload[0] : x)),
        isLoading: false,
        isError: false,
      };
    case 'DELETE_DATA':
      return state.filter(x => x.id !== action.id);
    case 'FETCH_FAILURE':
      return {
        ...state,
        isLoading: false,
        isError: true,
      };
    default:
      throw new Error(`Unhandled type: ${action.type}`);
  }
};

const useFetch = apiEndPoint => {
  const [state, dispatch] = useReducer(dataFetchReducer, {
    initialLoad: true,
    isLoading: true,
    isError: false,
    data: [],
  });

  const fetchData = (method, url, formData, headers) => {
    return axios({
      method,
      url,
      data: formData || null,
      timeout: method === 'get' ? 3000 : 5000,
      headers,
    })
      .then(res => {
        switch (method) {
          case 'get':
            dispatch({ type: 'FETCH_DATA', payload: res.data });
            break;
          case 'post':
            dispatch({ type: 'ADD_DATA', payload: formData });
            break;
          case 'put':
            // need to review what backend will actually use (should be an id)
            dispatch({
              type: 'UPDATE_DATA',
              payload: res.data.data,
              id: formData.id,
            });
            break;
          case 'delete':
            // need to review what backend will actually use (should be an id)
            dispatch({ type: 'DELETE_DATA', id: formData.Id });
            break;
          default:
            dispatch({});
        }
      })
      .catch(error => {
        const err = error;
        if (err.code === 'ECONNABORTED') {
          err.message = 'The request took too long - please try again later.';
        }
        dispatch({ type: 'FETCH_FAILURE', payload: error });
      });
  };

  useEffect(() => {
    // common problem in React that component state is set even though the
    // component got already unmounted (e.g. due to navigating away with React Router).
    // "didCancel" flag addresses that issue

    let didCancel = false;
    if (!didCancel) {
      if (state.initialLoad) {
        fetchData('get', apiEndPoint);
      } else {
        fetch();
      }
    }

    // clean up when component un-mounts
    return () => {
      didCancel = true;
    };
    // return () => (didCancel = true);
  }, [apiEndPoint, state.initialLoad]);

  return [state, fetchData, dispatch];
};

export default useFetch;
