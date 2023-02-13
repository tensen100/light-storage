import { createFunction, createGenerator, LightStorage, LightStorageConfig } from '../src';
// import * as CryptoJS from 'crypto-js';

// const key = CryptoJS.enc.Utf8.parse("1234123412ABCDEF");  //十六位十六进制数作为密钥
// const iv = CryptoJS.enc.Utf8.parse('ABCDEF1234123412');   //十六位十六进制数作为密钥偏移量
//
//
// function encrypt(data: string) {
//     let srcs = CryptoJS.enc.Utf8.parse(data);
//     let encrypted = CryptoJS.AES.encrypt(srcs, key, { iv: iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 });
//     return encrypted.ciphertext.toString().toUpperCase();
// }
//
// function decrypt(data: string) {
//     let encryptedHexStr = CryptoJS.enc.Hex.parse(data);
//     let srcs = CryptoJS.enc.Base64.stringify(encryptedHexStr);
//     let decrypt = CryptoJS.AES.decrypt(srcs, key, { iv: iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 });
//     let decryptedStr = decrypt.toString(CryptoJS.enc.Utf8);
//     return decryptedStr.toString();
// }

// class BigIntStorage extends LightStorage{
//     constructor(storage: Storage, config?: LightStorageConfig) {
//         super(storage, config);
//     }
//     protected _encode(data: any): string {
//         if(typeof data === 'bigint') {
//             data = data.toString() + 'n'
//         }
//         return super._encode(data)
//     }
//
//     protected _decode(data: string): any {
//         if(/^\d+n$/.test(data)){
//             return BigInt(data.slice(0, -1))
//         }
//         return super._decode(data);
//     }
// }

// const testStorage = new BigIntStorage(localStorage)

// testStorage.set<BigInt>('bigint', 99999999999999999999n)

// testStorage.eachKey((key) => console.log(key))

// console.log(testStorage.size())

// console.log(typeof testStorage.set('undefined', undefined))

// console.log(typeof testStorage.get('undefined'))

interface TestValue {
    key: string,
    data: any,
    desc: string,
}

const TEST_VALUES: TestValue [] = [
    // {
    //     key: 'test_key_null',
    //     data: null,
    //     desc: 'null'
    // },
    {
        key: 'test_key_undefined',
        data: undefined,
        desc: 'undefined'
    },
    // {
    //     key: 'test_key_true',
    //     data: true,
    //     desc: 'true'
    // },
    // {
    //     key: 'test_key_false',
    //     data: false,
    //     desc: 'false'
    // },
    // {
    //     key: 'test_key_number1',
    //     data: -1,
    //     desc: '-1'
    // },
    // {
    //     key: 'test_key_number2',
    //     data: 0,
    //     desc: '0'
    // },
    // {
    //     key: 'test_key_number3',
    //     data: 1,
    //     desc: '1'
    // },
    // {
    //     key: 'test_key_number4',
    //     data: NaN,
    //     desc: 'NaN'
    // },
    // {
    //     key: 'test_key_string',
    //     data: 'string',
    //     desc: '"string"'
    // },
    // {
    //     key: 'test_key_string_empty',
    //     data: '',
    //     desc: '""'
    // }
];

const ALL_VALUE: Record<string, any> = {};

TEST_VALUES.forEach(item => {
    ALL_VALUE[item.key] = item.data;
});


localStorage.clear();

const lightStorage = new LightStorage(localStorage)

const key = 'test_key'

console.log(lightStorage.set(key, 123))
console.log(lightStorage.remove(key))
console.log(lightStorage.get(key))
console.log(lightStorage.size())







