# storage

## Usage

### Usage 1
```typescript
import { LightStorage } from '@light/storage';

interface User{
    name: string,
    id: number,
}

declare const user:User

const localLightStorage = new LightStorage(localStorage)

localLightStorage.set<User>('user', user);

localLightStorage.get<User>('user')

localLightStorage.remove<User>('user');

localLightStorage.clear();

const listener = (oldValue: User | null, newValue: User | null) => {
    // do something
}
// 监听数据
localLightStorage.listen<User>('user', listener);

// 取消监听
localLightStorage.unListen<User>('user', listener);

localLightStorage.size();

localLightStorage.keys();

localLightStorage.eachKey((key: string) => {
    // do something
});

localLightStorage.each((key: string, value: any) => {
    // do something
});

localLightStorage.getAll<Record<string, any>>();

localLightStorage.setAll<Record<string, any>>({});
```

### Usage 2
```typescript
import { LightStorage, createGenerator } from '@light/storage';

interface User{
    name: string,
    id: number,
}
declare const user:User

const localLightStorage = new LightStorage(localStorage)

const createStorage = createGenerator(localLightStorage)

const userStorage = createStorage<User>('user');

userStorage.set(user)

userStorage.get()

userStorage.remove();

const listener = (oldValue: User | null, newValue: User | null) => {
    // do something
}

userStorage.listen(listener);

userStorage.unListen(listener);
```

### Usage3
```typescript
import { LightStorage, createFunction } from '@light/storage';

interface User{
    name: string,
    id: number,
}
declare const user:User

const localLightStorage = new LightStorage(localStorage)

const storage = createFunction(localLightStorage)

// set
storage<User>('user', user)

// get
storage<User>('user')

//remove
storage<User>('user',null)

// getAll
storage<Record<string, any>>()

// setAll
storage<Record<string, any>>({})

//clear
storage<Record<string, any>>(null)

// each
storage((key: string,value: any) => {
    // do something
})
```

## API

### LightStorage
```typescript
type Listener<T> = (oldVal: T | null, newValue: T | null) => void;

export declare class LightStorage {
    
    constructor(_storage: Storage, _config?: LightStorageConfig);
    
    get<T = any>(key: string): T | null;
    
    set<T = any>(key: string, val: T): T;
    
    remove<T = any>(key: string): T | null;
    
    clear(): void;
    
    // 监听数据
    listen<T = any>(key: string, listener: Listener<T>): void;
    
    // 取消监听
    unListen<T = any>(key: string, listener: Listener<T>): void;
    
    // 当前命名空间下的数量
    size(): number;
    
    // 当前命名空间下的key
    keys(): string[];
    
    eachKey(callback: (key: string) => void): void;
    
    each(callback: (key: string, value: any) => void): void;
    
    // 获取当前命名空间下的所有数据
    getAll<T extends Record<string, any>>(): T;
    
    // 同时设置多个数据
    setAll<T extends Record<string, any>>(data: T): T;
}
```

### LightStorageConfig

```typescript
type Code = (data: string) => string;

export interface LightStorageConfig {
    // 将数据编码后存储
    encode?: Code;
    // 解码数据
    decode?: Code;
    
    // 将key编码后存储
    encodeTitle?: Code;
    
    // 解码 key
    decodeTitle?: Code;
    
    // 命名空间，默认为 ” “， 不可重复, 命名空间可将数据进行隔离，操作互不影响
    namespace?: string;
}
```

### createGenerator

```typescript
declare function createGenerator(lightStorage: LightStorage): <T = any>(key: string) => LightSimpleStorage<T>;
```

### LightSimpleStorage
```typescript
type Listener<T> = (oldVal: T | null, newValue: T | null) => void;

export declare class LightSimpleStorage<T> {
    constructor(_key: string, _storage: LightStorage);
    
    get(): T | null;
    
    set(data: T): T;
    
    remove(): T | null;
    
    listen(listener: Listener<T>): void;
    
    unListen(listener: Listener<T>): void;
}
```

```typescript
interface StorageFn {
    // getAll
    <T extends Record<string, any>>(): T;
    
    // clear
    (clear: null): void;
    
    // setAll
    <T extends Record<string, any>>(data: T): T;
    
    // each
    (callback: (key: string, value: any) => void): void;
    
    // get
    <T = any>(key: string): T | null;
    
    // set
    <T = any>(key: string, data: T): T;
    
    // remove
    <T = any>(key: string, data: null): T | null;
}

export declare function createFunction(lightStorage: LightStorage): StorageFn;
```


## 支持Bigint
> 由于源码需要编译成es5, 所以无法内部支持Bigint, 如果有需要可以通过如下方式支持
```typescript
import { LightStorage, LightStorageConfig } from '@light/storage';

class BigIntStorage extends LightStorage{
    constructor(storage: Storage, config?: LightStorageConfig) {
        super(storage, config);
    }
    protected _encode(data: any): string {
        if(typeof data === 'bigint') {
            data = data.toString() + 'n'
        }
        return super._encode(data)
    }

    protected _decode(data: string): any {
        if(/^\d+n$/.test(data)){
            return BigInt(data.slice(0, -1))
        }
        return super._decode(data);
    }
}

const testStorage = new BigIntStorage(localStorage)

testStorage.set<BigInt>('bigInt', 99999999999999999999n)
```