const Joi = require('joi');

const registerSchema = Joi.object({
    email: Joi.string().email().required().messages({
        'string.email': 'Geçerli bir email adresi giriniz.',
        'any.required': 'Email alanı zorunludur.'
    }),
    password: Joi.string().min(8).pattern(new RegExp('^[a-zA-Z0-9]{3,30}$')).required().messages({
        'string.min': 'Şifre en az 8 karakter olmalıdır.',
        'any.required': 'Şifre alanı zorunludur.'
    })
});

const loginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
});

const validate = (schema) => (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
        return res.status(400).json({ error: error.details[0].message });
    }
    next();
};

module.exports = { registerSchema, loginSchema, validate };
