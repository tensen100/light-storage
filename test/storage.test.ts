

interface TestValue {
    key: string,
    data: any,
    desc: string,
}

const TEST_VALUES: TestValue [] = [
    {
        key: 'test_key_null',
        data: null,
        desc: 'null'
    },
    {
        key: 'test_key_undefined',
        data: undefined,
        desc: 'undefined'
    },
    {
        key: 'test_key_true',
        data: true,
        desc: 'true'
    },
    {
        key: 'test_key_false',
        data: false,
        desc: 'false'
    },
    {
        key: 'test_key_number1',
        data: -1,
        desc: '-1'
    },
    {
        key: 'test_key_number2',
        data: 0,
        desc: '0'
    },
    {
        key: 'test_key_number3',
        data: 1,
        desc: '1'
    },
    {
        key: 'test_key_number4',
        data: NaN,
        desc: 'NaN'
    },
    {
        key: 'test_key_string',
        data: 'string',
        desc: '"string"'
    },
    {
        key: 'test_key_string_empty',
        data: '',
        desc: '""'
    }
];

const ALL_VALUE: Record<string, any> = {};

TEST_VALUES.forEach(item => {
    ALL_VALUE[item.key] = item.data;
});

interface TestListenValue<T> {
    oldValue: T | null,
    newValue: T | null
}

const TEST_LISTEN_VALUES: TestListenValue<number>[] = [
    {
        oldValue: null,
        newValue: 1
    },
    {
        oldValue: 1,
        newValue: 2
    },
    {
        oldValue: 2,
        newValue: null
    }
];

const NAMESPACE_DIVIDE = ' ';


const STORAGES = [
    {name: 'localStorage', storage: localStorage}
    // {name: 'sessionStorage', storage: sessionStorage}
];


STORAGES.forEach(item => {
    describe('LightStorage width ' + item.name, () => {
        jest.resetModules();
        const {LightStorage} = require('../src');
        item.storage.clear();

        const testLocalStorage = new LightStorage(item.storage);
        TEST_VALUES.forEach((testValue) => {
            test(`set(${testValue.desc})`, () => {
                expect(testLocalStorage.set(testValue.key, testValue.data)).toBe(testValue.data);
            });
            test(`get(${testValue.desc})`, () => {
                expect(testLocalStorage.get(testValue.key)).toBe(testValue.data);
            });
            test(`remove(${testValue.desc})`, () => {
                expect(testLocalStorage.remove(testValue.key)).toBe(testValue.data);
                expect(testLocalStorage.get(testValue.key)).toBe(null);
                testLocalStorage.each((key: string, val: any) => console.log(key, val));
                expect(testLocalStorage.size()).toBe(0);
            });
        });

        test('setAll()', () => {
            expect(testLocalStorage.setAll(ALL_VALUE)).toEqual(ALL_VALUE);
        });

        test('getAll()', () => {
            expect(testLocalStorage.getAll()).toEqual(ALL_VALUE);
        });

        test('size()', () => {
            expect(testLocalStorage.size()).toBe(TEST_VALUES.length);
        });

        test('keys()', () => {
            const keys = testLocalStorage.keys().sort();
            const sourceKeys = TEST_VALUES.map(item => item.key).sort();
            expect(keys).toEqual(sourceKeys);
        });

        test('each()', () => {
            testLocalStorage.each((key: string, value: any) => {
                const source = TEST_VALUES.find(item => item.key === key);
                expect(value).toBe(source?.data);
            });
        });

        test('clear()', () => {
            testLocalStorage.clear();
            expect(testLocalStorage.size()).toBe(0);
        });

        test('listen() and unListen()', () => {
            const key = 'test_key_listen';


            let step = 0;

            const callback = (oldValue: any, newValue: any) => {
                expect(oldValue).toBe(TEST_LISTEN_VALUES[step].oldValue);
                expect(newValue).toBe(TEST_LISTEN_VALUES[step].newValue);
                step++;
            };

            testLocalStorage.listen(key, callback);

            testLocalStorage.set(key, 1);

            testLocalStorage.set(key, 2);

            testLocalStorage.remove(key);

            testLocalStorage.unListen(key, callback);

            testLocalStorage.set(key, 3);

            testLocalStorage.remove(key);

            expect(step).toBe(3);
        });

        test('clearAll listen',() =>{
            let count = 0;
            const listens = TEST_VALUES.map(testValue => {
                const values = [null, ALL_VALUE[testValue.key], null];
                let step = 0;
                const listen = (oldValue: any, newValue: any) => {
                    expect(oldValue).toBe(values[step]);
                    expect(newValue).toBe(values[step + 1]);
                    step++;
                    count++;
                };
                testLocalStorage.listen(testValue.key, listen);

                return listen;
            });

            testLocalStorage.setAll(ALL_VALUE);
            testLocalStorage.clear();

            TEST_VALUES.forEach((testValue, index) => {
                testLocalStorage.unListen(testValue.key, listens[index]);
            });

            testLocalStorage.setAll(ALL_VALUE);

            expect(count).toBe(TEST_VALUES.length * 2);
        })
    });

    describe('LightSimpleStorage width ' + item.name, () => {
        jest.resetModules();
        const {LightStorage, createGenerator} = require('../src');
        item.storage.clear();

        const createStorage = createGenerator(new LightStorage(item.storage));

        TEST_VALUES.forEach(item => {
            const storage = createStorage(item.key);

            test(`set(${item.desc})`, () => {
                expect(storage.set(item.data)).toBe(item.data);
            });

            test(`get(${item.desc})`, () => {
                expect(storage.get()).toBe(item.data);
            });

            test(`remove(${item.desc})`, () => {
                expect(storage.remove()).toBe(item.data);
                expect(storage.get()).toBe(null);
            });
        });


        test('listen() and unListen()', () => {

            const listenStorage = createStorage('test_key_listen');

            let step = 0;

            const callback = (oldValue: any, newValue: any) => {
                expect(oldValue).toBe(TEST_LISTEN_VALUES[step].oldValue);
                expect(newValue).toBe(TEST_LISTEN_VALUES[step].newValue);
                step++;
            };

            listenStorage.listen(callback);

            listenStorage.set(1);

            listenStorage.set(2);

            listenStorage.remove();

            listenStorage.unListen(callback);

            listenStorage.set(3);

            listenStorage.remove();

            expect(step).toBe(3);
        });

    });

    describe('StorageFunction width ' + item.name, () => {
        jest.resetModules();
        const {LightStorage, createFunction} = require('../src');
        item.storage.clear();

        const storage = createFunction(new LightStorage(item.storage));
        TEST_VALUES.forEach(item => {
            if (item.data !== null) {
                // set
                test(`set()/storage(${item.key}, ${item.desc})`, () => {
                    expect(storage(item.key, item.data)).toBe(item.data);
                });
                // get
                test(`get()/storage(${item.key})`, () => {
                    expect(storage(item.key)).toBe(item.data);
                });

                // remove
                test(`remove()/storage(${item.key}, null)`, () => {
                    expect(storage(item.key, null)).toBe(item.data);
                    expect(storage(item.key)).toBe(null);
                });
            }
        });

        // setAll
        test('setAll()/storage({...})', () => {
            expect(storage(ALL_VALUE)).toEqual(ALL_VALUE);
        });

        // getAll
        test('getAll()/storage()', () => {
            expect(storage()).toEqual(ALL_VALUE);
        });


        //each
        test('each()/storage((key,value)=> {})', () => {
            storage((key: string, value: any) => {
                expect(value).toBe(value);
            });
        });

        // clear
        test('clear()/storage(null)', () => {
            storage(null);
            expect(storage()).toEqual({});
        });
    });

    describe('namespace error width ' + item.name, () => {
        test('namespace can not identical', () => {
            const namespace = 'namespace';
            expect(() => {
                jest.resetModules();
                const {LightStorage} = require('../src');
                new LightStorage(item.storage, {namespace});
                new LightStorage(item.storage, {namespace});
            }).toThrow(`you cannot set two identical namespaces: "${namespace}"`);

            expect(() => {
                jest.resetModules();
                const {LightStorage} = require('../src');
                new LightStorage(item.storage, {namespace: ''});
                new LightStorage(item.storage, {namespace: ''});
            }).toThrow(`you cannot set two identical namespaces: ""`);

            expect(() => {
                jest.resetModules();
                const {LightStorage} = require('../src');
                new LightStorage(item.storage);
                new LightStorage(item.storage);
            }).toThrow(`you cannot set two identical namespaces: ""`);

        });

        test(`namespace can include "${NAMESPACE_DIVIDE}"`, () => {
            jest.resetModules();
            const {LightStorage} = require('../src');
            expect(() => new LightStorage(item.storage, {namespace: NAMESPACE_DIVIDE}))
                .toThrow(`cannot include "${NAMESPACE_DIVIDE}" in namespace:${NAMESPACE_DIVIDE}`);
        });
    });

    describe('encode error width ' + item.name, () => {
        jest.resetModules();
        const {LightStorage} = require('../src');

        function aesEncrypt(data: string) {
            return data;
        }

        test('encode and decode must be both', () => {

            expect(() => new LightStorage(item.storage, {encode: aesEncrypt}))
                .toThrow('encode and decode must be both');

            expect(() => new LightStorage(item.storage, {decode: aesEncrypt}))
                .toThrow('encode and decode must be both');
        });

        test('encodeKey and decodeKey must be both', () => {
            expect(() => new LightStorage(item.storage, {encodeKey: aesEncrypt}))
                .toThrow('encodeKey and decodeKey must be both');

            expect(() => new LightStorage(item.storage, {decodeKey: aesEncrypt}))
                .toThrow('encodeKey and decodeKey must be both');
        });
    });

    describe('value error width ' + item.name, () => {
        jest.resetModules();
        const {LightStorage} = require('../src');
        const lightStorage = new LightStorage(item.storage);
        test('cannot support symbol', () => {
            expect(() => lightStorage.set('symbol', Symbol('symbol'))).toThrow('cannot support symbol!');
        });

        test('key cannot be empty', () => {
            expect(() => lightStorage.get('')).toThrow('key cannot be empty!');
        });

        test(`key cannot include "${NAMESPACE_DIVIDE}"`, () => {
            const key = `a${NAMESPACE_DIVIDE}b`
            expect(() => lightStorage.get(key)).toThrow(`cannot include "${NAMESPACE_DIVIDE}" in key: "${key}"`);
        });
    });

    describe('config width ' + item.name, () => {
        jest.resetModules();
        const {LightStorage} = require('../src');
        const CryptoJS = require('crypto-js');
        item.storage.clear();

        const key = CryptoJS.enc.Utf8.parse('1234123412ABCDEF');  //十六位十六进制数作为密钥
        const iv = CryptoJS.enc.Utf8.parse('ABCDEF1234123412');   //十六位十六进制数作为密钥偏移量


        function encrypt(data: string) {
            let srcs = CryptoJS.enc.Utf8.parse(data);
            let encrypted = CryptoJS.AES.encrypt(srcs, key, {
                iv: iv,
                mode: CryptoJS.mode.CBC,
                padding: CryptoJS.pad.Pkcs7
            });
            return encrypted.ciphertext.toString().toUpperCase();
        }

        function decrypt(data: string) {
            let encryptedHexStr = CryptoJS.enc.Hex.parse(data);
            let srcs = CryptoJS.enc.Base64.stringify(encryptedHexStr);
            let decrypt = CryptoJS.AES.decrypt(srcs, key, {
                iv: iv,
                mode: CryptoJS.mode.CBC,
                padding: CryptoJS.pad.Pkcs7
            });
            let decryptedStr = decrypt.toString(CryptoJS.enc.Utf8);
            return decryptedStr.toString();
        }

        const otherKey = `a${NAMESPACE_DIVIDE}b`;
        const otherValue = `a${NAMESPACE_DIVIDE}b`;
        function setOther(){
            item.storage.setItem(otherKey, otherValue);
        }

        function getOther(){
            return item.storage.getItem(otherKey);
        }


        const lightStorages = ['', 'namespace1', 'namespace2'].map(namespace => {
            return {
                namespace,
                storage: new LightStorage(item.storage, {
                    decode: decrypt,
                    encode: encrypt,
                    decodeKey: decrypt,
                    encodeKey: encrypt,
                    namespace
                })
            };
        });

        TEST_VALUES.forEach((testValue) => {
            lightStorages.forEach(lightStorage => {
                test(`namespace:"${lightStorage.namespace}" set(${testValue.desc})`, () => {
                    expect(lightStorage.storage.set(testValue.key, testValue.data)).toBe(testValue.data);
                });
                test(`namespace:"${lightStorage.namespace}" get(${testValue.desc})`, () => {
                    expect(lightStorage.storage.get(testValue.key)).toBe(testValue.data);
                });
                test(`namespace:"${lightStorage.namespace}" remove(${testValue.desc})`, () => {
                    expect(lightStorage.storage.remove(testValue.key)).toBe(testValue.data);
                    expect(lightStorage.storage.get(testValue.key)).toBe(null);
                    expect(lightStorage.storage.size()).toBe(0);
                });
            });
        });

        lightStorages.forEach(lightStorage => {
            test(`namespace:"${lightStorage.namespace}" setAll()`, () => {
                setOther()
                expect(lightStorage.storage.setAll(ALL_VALUE)).toEqual(ALL_VALUE);
                expect(getOther()).toBe(otherValue)
            });

            test(`namespace:"${lightStorage.namespace}" getAll()`, () => {
                setOther()
                expect(lightStorage.storage.getAll()).toEqual(ALL_VALUE);
                expect(getOther()).toBe(otherValue)
            });

            test(`namespace:"${lightStorage.namespace}" size()`, () => {
                setOther()
                expect(lightStorage.storage.size()).toBe(TEST_VALUES.length);
                expect(getOther()).toBe(otherValue)
            });

            test(`namespace:"${lightStorage.namespace}" keys()`, () => {
                setOther()
                const keys = lightStorage.storage.keys().sort();
                const sourceKeys = TEST_VALUES.map(item => item.key).sort();
                expect(keys).toEqual(sourceKeys);
                expect(getOther()).toBe(otherValue)
            });

            test(`namespace:"${lightStorage.namespace}" each()`, () => {
                setOther()
                lightStorage.storage.each((key: string, value: any) => {
                    const source = TEST_VALUES.find(item => item.key === key);
                    expect(value).toBe(source?.data);
                });
                getOther()
            });

            test(`namespace:"${lightStorage.namespace}" clear()`, () => {
                setOther()
                lightStorage.storage.clear();
                expect(lightStorage.storage.size()).toBe(0);
                getOther()
            });

            test(`namespace:"${lightStorage.namespace}" listen() and unListen()`, () => {
                setOther()
                const key = 'test_key_listen';


                let step = 0;

                const callback = (oldValue: any, newValue: any) => {
                    expect(oldValue).toBe(TEST_LISTEN_VALUES[step].oldValue);
                    expect(newValue).toBe(TEST_LISTEN_VALUES[step].newValue);
                    step++;
                };

                lightStorage.storage.listen(key, callback);

                lightStorage.storage.set(key, 1);

                lightStorage.storage.set(key, 2);

                lightStorage.storage.remove(key);

                lightStorage.storage.unListen(key, callback);

                lightStorage.storage.set(key, 3);

                lightStorage.storage.remove(key);

                expect(step).toBe(3);

                expect(getOther()).toBe(otherValue)
            });

            test(`namespace:"${lightStorage.namespace}" all listen() and unListen()`, () => {
                setOther()
                let count = 0;
                const listens = TEST_VALUES.map(testValue => {
                    const values = [null, ALL_VALUE[testValue.key], null];
                    let step = 0;
                    const listen = (oldValue: any, newValue: any) => {
                        expect(oldValue).toBe(values[step]);
                        expect(newValue).toBe(values[step + 1]);
                        step++;
                        count++;
                    };
                    lightStorage.storage.listen(testValue.key, listen);

                    return listen;
                });

                lightStorage.storage.setAll(ALL_VALUE);
                lightStorage.storage.clear();

                TEST_VALUES.forEach((testValue, index) => {
                    lightStorage.storage.unListen(testValue.key, listens[index]);
                });

                lightStorage.storage.setAll(ALL_VALUE);

                expect(count).toBe(TEST_VALUES.length * 2);
                expect(getOther()).toBe(otherValue)
            });
        });
    });

});

