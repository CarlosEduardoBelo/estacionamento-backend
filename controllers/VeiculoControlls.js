const express = require('express');
const { body, validationResult } = require('express-validator');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const Veiculo = require('../models/Veiculo');

const router = express.Router();

// Middlewares de segurança
router.use(helmet());
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100 // Limite cada IP a 100 requisições por janela
});
router.use(limiter);

// Middleware de autenticação 
const authenticate = (req, res, next) => {
    const token = req.header('Authorization') && req.header('Authorization').split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'Access denied. No token provided.' });
    }
    try {
        const decoded = jwt.verify(token, 'your_jwt_secret'); // Substitua 'your_jwt_secret' pela sua chave secreta
        req.user = decoded;
        next();
    } catch (ex) {
        res.status(400).json({ message: 'Invalid token.' });
    }
};

// Middleware de validação de entrada
const veiculoValidationRules = () => {
    return [
        body('placa').isString().notEmpty().withMessage('Placa é obrigatória'),
        body('ano').isInt({ min: 1886 }).withMessage('Ano inválido'),
        body('mensalidade').isFloat({ min: 0 }).withMessage('Mensalidade inválida'),
        body('fk_proprietario').isInt().withMessage('ID do proprietário inválido')
    ];
};

const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

// Busca Veiculo (GET)
router.get('/', /*authenticate,*/ async (req, res) => {
    const veiculos = await Veiculo.findAll();
    res.status(200).json(veiculos);
});

// Cadastra Veiculo (POST)
router.post('/', /*authenticate,*/ veiculoValidationRules(), validate, async (req, res) => {
    const { placa, ano, mensalidade, fk_proprietario } = req.body;
    const newEdit = await Veiculo.create({
        placa, ano, mensalidade, fk_proprietario
    });
    res.status(200).json({ message: 'Cadastrado com sucesso' });
});

// Busca Por id a Veiculo (GET)
router.get('/:id', /*authenticate,*/ async (req, res) => {
    const veiculo = await Veiculo.findByPk(req.params.id);
    if (!veiculo) {
        return res.status(404).json({ message: 'Veículo não encontrado' });
    }
    res.status(200).json(veiculo);
});

// Deleta Veiculo por id (DELETE)
router.delete('/:id', /*authenticate,*/ async (req, res) => {
    const result = await Veiculo.destroy({
        where: { id_veiculo: req.params.id },
    });
    if (!result) {
        return res.status(404).json({ message: 'Veículo não encontrado' });
    }
    res.status(200).json({ message: 'Excluído com sucesso' });
});

// Altera Veiculo por ID (PUT)
router.put('/:id', /*authenticate,*/ veiculoValidationRules(), validate, async (req, res) => {
    const { placa, ano, mensalidade, fk_proprietario } = req.body;
    const result = await Veiculo.update(
        { placa, ano, mensalidade, fk_proprietario },
        {
            where: { id_veiculo: req.params.id },
        }
    );
    if (!result[0]) {
        return res.status(404).json({ message: 'Veículo não encontrado' });
    }
    res.status(200).json({ message: 'Atualizado com sucesso' });
});

module.exports = router;