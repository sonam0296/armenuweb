let successPattern = (code, data, status) => {
	return {
		'code': code,
		'data': data,
		'status': status
	};
};

let errorPattern = (code, message, status) => {
	return {
		'code': code,
		'data': message,
		'status': status
	};
};

module.exports = {
	successPattern,
	errorPattern
};
