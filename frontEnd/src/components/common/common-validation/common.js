import {toast} from 'react-toastify';

export const successToaster = (message) => {
    return toast.success(message, {
        position: toast.POSITION.TOP_RIGHT
    });
};

export const errorToaster = (message) => {
    return toast.error(message, {
        position: toast.POSITION.TOP_RIGHT
    });
};

export const DarkToaster = (message) => {
    return toast.dark(message, {
        position: toast.POSITION.TOP_RIGHT
    });
};
