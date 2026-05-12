function success(res, data, message = 'Success') {
  return res.status(200).json({ success: true, message, data });
}

function created(res, data, message = 'Created') {
  return res.status(201).json({ success: true, message, data });
}

function validationError(res, errors, message = 'Validation error') {
  return res.status(422).json({ success: false, message, errors });
}

module.exports = {
  success,
  created,
  validationError,
};
