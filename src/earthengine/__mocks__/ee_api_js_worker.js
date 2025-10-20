// Minimal, clean mock of the Earth Engine API used by ee_worker_utils tests
const mockFn = jest.fn(() => mockFn)
mockFn.apply = jest.fn()
mockFn.gt = jest.fn(() => mockFn)
mockFn.lt = jest.fn(() => mockFn)
mockFn.and = jest.fn(() => mockFn)
mockFn.or = jest.fn(() => mockFn)
mockFn.millis = jest.fn(() => 123456789)
mockFn.difference = jest.fn(() => mockFn)
mockFn.advance = jest.fn(() => mockFn)
mockFn.get = jest.fn(() => 2025)

const makeImage = () => {
    const img = {}
    img.select = jest.fn((...args) => {
        if (args.length && typeof args[0] === 'number') {
            return {
                projection: jest.fn(() => ({
                    nominalScale: jest.fn(() => 30),
                })),
            }
        }
        return makeImage()
    })
    img.remap = jest.fn(() => makeImage())
    img.updateMask = jest.fn(() => makeImage())
    img.gt = jest.fn(() => makeImage())
    img.add = jest.fn(() => makeImage())
    img.toFloat = jest.fn(() => makeImage())
    img.multiply = jest.fn(() => makeImage())
    img.addBands = jest.fn(() => makeImage())
    img.divide = jest.fn(() => makeImage())
    img.rename = jest.fn(() => makeImage())
    img.set = jest.fn(meta => {
        img._meta = meta
        return img
    })
    img.bandNames = jest.fn(() => {
        const bn = ['B1', 'B2']
        bn.add = jest.fn(name => {
            bn.push(name)
            return bn
        })
        return bn
    })
    img.get = jest.fn(() => 0)
    img.millis = jest.fn(() => 0)
    img.advance = jest.fn(() => {
        return img
    })
    img.difference = jest.fn(() => 0)
    img.format = jest.fn(() => '01')
    return img
}

const createReducerInstance = () => {
    const instance = {}
    instance.unweighted = jest.fn(() => instance)
    instance.combine = (...args) => {
        ee.Reducer.combine(...args)
        return instance
    }
    return instance
}

const ee = {}

ee.Filter = {
    date: jest.fn(() => mockFn),
    or: jest.fn(() => mockFn),
    and: jest.fn(() => mockFn),
    lt: jest.fn(() => mockFn),
    gt: jest.fn(() => mockFn),
}

ee.Reducer = {
    mean: jest.fn(() => createReducerInstance()),
    sum: jest.fn(() => createReducerInstance()),
    minMax: jest.fn(() => createReducerInstance()),
    combine: jest.fn(() => createReducerInstance()),
}

const ImageMock = jest.fn(() => makeImage())
ImageMock.constant = jest.fn(() => ({
    float: jest.fn(() => makeImage()),
    rename: jest.fn(() => makeImage()),
}))
ee.Image = ImageMock

const imageCollectionObj = {}
imageCollectionObj.map = jest.fn(() => imageCollectionObj)
imageCollectionObj.filter = jest.fn(() => imageCollectionObj)
imageCollectionObj.reduce = jest.fn(() => makeImage())
imageCollectionObj.sort = jest.fn(() => imageCollectionObj)
const bandNamesMock = () => {
    const bn = []
    bn.add = jest.fn(name => {
        bn.push(name)
        return bn
    })
    return jest.fn(() => bn)
}

imageCollectionObj.first = jest.fn(() => ({ bandNames: bandNamesMock() }))
imageCollectionObj.linkCollection = jest.fn(() => imageCollectionObj)
imageCollectionObj.reduceColumns = jest.fn(() => ({
    get: k => (k === 'min' ? 0 : 123456789),
}))
imageCollectionObj.aggregate_sum = jest.fn(() => 100)
imageCollectionObj.size = jest.fn(() => ({ gt: jest.fn(() => true) }))
imageCollectionObj.get = jest.fn(() => 0)

ee.ImageCollection = jest.fn(() => imageCollectionObj)
ee.ImageCollection.fromImages = jest.fn(() => imageCollectionObj)

const makeDate = () => {
    const d = {}
    d.millis = jest.fn(() => 0)
    d.advance = jest.fn(() => d)
    d.difference = jest.fn(() => 0)
    d.get = jest.fn(k => (k === 'year' ? 2025 : 1))
    d.format = jest.fn(() => '01')
    return d
}

ee.Date = jest.fn(() => makeDate())
ee.Date.fromYMD = jest.fn(() => makeDate())

ee.Algorithms = { If: jest.fn((cond, a, b) => (cond ? a : b)) }

ee.List = { sequence: jest.fn(() => [0, 1, 2]) }

ee.Number = jest.fn(n => n)

ee.String = jest.fn(str => {
    const s = { _str: String(str) }
    s.cat = jest.fn(other => {
        const otherStr = other && other._str ? other._str : String(other)
        s._str = s._str + otherStr
        return s
    })
    s.toString = jest.fn(() => s._str)
    return s
})

export default ee
