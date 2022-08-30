const express = require('express')
const { v4: uuidv4 } = require('uuid')

const app = express()
app.use(express.json())

/**
 * id - uuid
 * name - string
 * cpf - string
 * statement - []
 */
const customers = []
const getBalance = (statement) => {
  const balance = statement.reduce((acc, operation) => {
    if (operation.type === 'credit') {
      return acc + operation.amount
    } else {
      return acc - operation.amount
    }
  }, 0)

  return balance
}

// Middleware
const verifyIfExistsAccountCPF = (request, response, next) => {
  const { cpf } = request.headers

  const customer = customers.find(customer => customer.cpf === cpf)

  if (!customer) {
    return response.status(400).send({ erro: 'Customer not found' })
  }

  request.customer = customer

  return next()
}

app.get('/account', verifyIfExistsAccountCPF, (request, response) => {
  const { customer } = request

  return response.status(201).json(customer)
})

app.post('/account', (request, response) => {
  const { cpf, name } = request.body

  const customerAlreadyExists = customers.some(customer =>
    customer.cpf === cpf
  )
  if (customerAlreadyExists) {
    return response.status(400).send({ erro: 'Customer already exists' })
  }

  customers.push({ id: uuidv4(), name, cpf, statement: [] })
  return response.status(201).send()
})

app.put('/account', verifyIfExistsAccountCPF, (request, response) => {
  const { name } = request.body
  const { customer } = request

  customer.name = name

  return response.status(201).send()
})

app.delete('/account', verifyIfExistsAccountCPF, (request, response) => {
  const { customer } = request

  customers.splice(customer, 1)

  return response.status(200).json(customers)
})

app.get('/balance', verifyIfExistsAccountCPF, (request, response) => {
  const { customer } = request

  const balance = getBalance(customer.statement)

  return response.status(200).json(balance)
})

app.get('/statement', verifyIfExistsAccountCPF, (request, response) => {
  const { customer } = request

  return response.status(200).json(customer.statement)
})

app.post('/deposit', verifyIfExistsAccountCPF, (request, response) => {
  const { description, amount } = request.body
  const { customer } = request

  const statementOperation = {
    type: 'credit', description, amount, created_at: new Date()
  }
  customer.statement.push(statementOperation)

  return response.status(201).send()
})

app.post('/withdraw', verifyIfExistsAccountCPF, (request, response) => {
  const { amount } = request.body
  const { customer } = request

  const balance = getBalance(customer.statement)

  if (balance < amount) {
    response.status(400).json({ error: 'Insuficient funds' })
  }

  const statementOperation = {
    type: 'debit', amount, created_at: new Date()
  }
  customer.statement.push(statementOperation)

  return response.status(201).send()
})

app.get('/statement/date', verifyIfExistsAccountCPF, (request, response) => {
  const { date } = request.query
  const { customer } = request

  const dateFormat = new Date(date + " 00:00")

  const statement = customer.statement.filter(operation =>
    operation.created_at.toDateString() === new Date(dateFormat).toDateString()
  )

  return response.status(200).json(statement)
})

app.listen("3333")
