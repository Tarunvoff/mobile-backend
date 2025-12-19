import { validationResult } from 'express-validator';

export const validate = (validations) => async (req, res, next) => {
  await Promise.all(validations.map((validation) => validation.run(req)));

  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }

  const formattedErrors = errors.array().map((error) => ({
    field: error.path,
    message: error.msg,
  }));

  return res.status(400).json({
    success: false,
    message: 'Validation failed',
    errors: formattedErrors,
  });
};

export default validate;
