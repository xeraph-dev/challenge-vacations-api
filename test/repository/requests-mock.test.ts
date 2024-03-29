import test from 'ava'

import { Request, RequestPartialCreate, RequestPartialStatus } from '~/models'
import {
  mockRequestsRepository,
  RequestRepositoryErrors,
} from '~/repository/requests'

const mockRequest: Request = {
  id: '1',
  author: '1',
  status: 'pending',
  resolved_by: '1',
  created_at: 1647957561003,
  updated_at: 1647957561003,
  vacation_start_date: 1647957561003,
  vacation_end_date: 1647957561003,
}
const mockRequestJanuary: Request = {
  id: '1',
  author: '1',
  status: 'approved',
  resolved_by: '1',
  created_at: 1647957561003,
  updated_at: 1647957561003,
  vacation_start_date: new Date('1-1-2022').getTime(),
  vacation_end_date: new Date('1-10-2022').getTime(),
}
const mockRequestFebruary: Request = {
  id: '1',
  author: '1',
  status: 'rejected',
  resolved_by: '1',
  created_at: 1647957561003,
  updated_at: 1647957561003,
  vacation_start_date: new Date('2-1-2022').getTime(),
  vacation_end_date: new Date('2-10-2022').getTime(),
}
const mockRequestJanuaryFebruary: Request = {
  id: '1',
  author: '1',
  status: 'pending',
  resolved_by: '1',
  created_at: 1647957561003,
  updated_at: 1647957561003,
  vacation_start_date: new Date('1-15-2022').getTime(),
  vacation_end_date: new Date('2-2-2022').getTime(),
}

/// Get requests
test('getRequests -> it works', async t => {
  const requests = await mockRequestsRepository([mockRequest]).getRequests()
  t.deepEqual(requests, [mockRequest])
})

test('getRequests -> filtered by status works', async t => {
  const requests = await mockRequestsRepository([mockRequest]).getRequests({
    status: 'pending',
  })
  t.deepEqual(requests, [mockRequest])
})

test('getRequests -> filtered by status empty', async t => {
  const requests = await mockRequestsRepository([mockRequest]).getRequests({
    status: 'approved',
  })
  t.deepEqual(requests, [])
})

test('getRequests -> filtered by month works', async t => {
  const mockRequests: Request[] = [
    mockRequestJanuary,
    mockRequestFebruary,
    mockRequestJanuaryFebruary,
  ]
  const requests = await mockRequestsRepository(mockRequests).getRequests({
    month: 1,
  })
  t.deepEqual(requests, [mockRequestJanuary, mockRequestJanuaryFebruary])
})

test('getRequests -> filtered by month empty', async t => {
  const mockRequests: Request[] = [
    mockRequestJanuary,
    mockRequestFebruary,
    mockRequestJanuaryFebruary,
  ]
  const requests = await mockRequestsRepository(mockRequests).getRequests({
    month: 3,
  })
  t.deepEqual(requests, [])
})

test('getRequests -> filtered by range works 1/1/2022 to 10/1/2022', async t => {
  const mockRequests: Request[] = [
    mockRequestJanuary,
    mockRequestFebruary,
    mockRequestJanuaryFebruary,
  ]
  const requests = await mockRequestsRepository(mockRequests).getRequests({
    range: {
      start_date: new Date('1-1-2022').getTime(),
      end_date: new Date('1-10-2022').getTime(),
    },
  })

  t.deepEqual(requests, [mockRequestJanuary])
})

test('getRequests -> filtered by range works 1/1/2022 to 2/2/2022', async t => {
  const mockRequests: Request[] = [
    mockRequestJanuary,
    mockRequestFebruary,
    mockRequestJanuaryFebruary,
  ]
  const requests = await mockRequestsRepository(mockRequests).getRequests({
    range: {
      start_date: new Date('1-1-2022').getTime(),
      end_date: new Date('1-20-2022').getTime(),
    },
  })

  t.deepEqual(requests, [mockRequestJanuary, mockRequestJanuaryFebruary])
})

test('getRequests -> filtered by range empty', async t => {
  const mockRequests: Request[] = [
    mockRequestJanuary,
    mockRequestFebruary,
    mockRequestJanuaryFebruary,
  ]
  const requests = await mockRequestsRepository(mockRequests).getRequests({
    range: {
      start_date: new Date('10-1-2022').getTime(),
      end_date: new Date('10-10-2022').getTime(),
    },
  })

  t.deepEqual(requests, [])
})

test('getRequests -> filtered by range with empty range', async t => {
  const mockRequests: Request[] = [
    mockRequestJanuary,
    mockRequestFebruary,
    mockRequestJanuaryFebruary,
  ]
  const requests = await mockRequestsRepository(mockRequests).getRequests({
    range: {} as never,
  })

  t.deepEqual(requests, mockRequests)
})

test('getRequests -> empty', async t => {
  const requests = await mockRequestsRepository([]).getRequests()
  t.deepEqual(requests, [])
})

/// Get request by id
test('getRequestById -> it works', async t => {
  const request = await mockRequestsRepository([mockRequest]).getRequestById(
    mockRequest.id,
  )
  t.deepEqual(request, mockRequest)
})

test('getRequestById -> request not found', async t => {
  try {
    await mockRequestsRepository([]).getRequestById(mockRequest.id)
  } catch (error) {
    t.is(error, RequestRepositoryErrors.NotFound)
  }
})

/// Get requests by worker id
test('getRequestsByWorkerId -> empty', async t => {
  const requests = await mockRequestsRepository([]).getRequestsByWorkerId(
    mockRequest.author,
  )
  t.deepEqual(requests, [])
})

test('getRequestsByWorkerId -> it works', async t => {
  const requests = await mockRequestsRepository([
    mockRequest,
  ]).getRequestsByWorkerId(mockRequest.author)
  t.deepEqual(requests, [mockRequest])
})

/// Set request
test('setRequest -> it works', async t => {
  const newRequest: RequestPartialCreate = {
    author: mockRequest.author,
    vacation_end_date: Date.now() + 1000 * 60 * 60 * 24 * 7, /// 7 days more
    vacation_start_date: Date.now(),
  }
  const mockRequests: Request[] = []
  const request = await mockRequestsRepository(mockRequests).setRequest(
    newRequest,
  )

  t.is(request.status, 'pending')
  t.is(request.vacation_start_date, newRequest.vacation_start_date)
  t.is(request.vacation_end_date, newRequest.vacation_end_date)
  t.is(request.author, newRequest.author)

  t.deepEqual(mockRequests, [request])
})

test('setRequest -> invalid vacation (start date greater than end date)', async t => {
  const newRequest: RequestPartialCreate = {
    author: mockRequest.author,
    vacation_start_date: Date.now() + 1000 * 60 * 60 * 24 * 7, /// 7 days more
    vacation_end_date: Date.now(),
  }
  try {
    await mockRequestsRepository([]).setRequest(newRequest)
  } catch (error) {
    t.is(error, RequestRepositoryErrors.InvalidVacation)
  }
})

test('setRequest -> invalid vacation (start date equal to end date)', async t => {
  const newRequest: RequestPartialCreate = {
    author: mockRequest.author,
    vacation_start_date: Date.now(),
    vacation_end_date: Date.now(),
  }
  try {
    await mockRequestsRepository([]).setRequest(newRequest)
  } catch (error) {
    t.is(error, RequestRepositoryErrors.InvalidVacation)
  }
})

/// Update request status
test('updateRequestStatus -> it works', async t => {
  const newRequest: RequestPartialStatus = {
    id: mockRequest.id,
    status: 'approved',
    resolved_by: '1',
  }
  const mockRequests: Request[] = [mockRequest]
  const request = await mockRequestsRepository(
    mockRequests,
  ).updateRequestStatus(newRequest)

  t.is(request.status, newRequest.status)
  t.is(request.resolved_by, newRequest.resolved_by)

  t.deepEqual(mockRequests, [request])
})

test('updateRequestStatus -> request not found', async t => {
  const newRequest: RequestPartialStatus = {
    id: mockRequest.id,
    status: 'approved',
    resolved_by: '1',
  }
  try {
    await mockRequestsRepository([]).updateRequestStatus(newRequest)
  } catch (error) {
    t.is(error, RequestRepositoryErrors.NotFound)
  }
})
