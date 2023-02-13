type Listener<T> = (oldVal: T | null, newValue: T | null) => void;
type Code = (data: string) => string;

export interface LightStorageConfig {

    // 编码
    encode?: Code;

    // 解码
    decode?: Code;

    // 标题编码
    encodeKey?: Code;

    // 标题解码
    decodeKey?: Code;

    // 命名空间
    namespace?: string;
}

const NAMESPACE_DIVIDE = ' ';

const NAN = 'NaN';
const UNDEFINED = 'undefined';


export class LightStorage {

    private _listener: Record<string, Listener<any>[]> = {};
    private static _namespaces = new Map<Storage, string[]>();


    constructor(private readonly _storage: Storage, private _config?: LightStorageConfig) {

        const namespace = _config?.namespace || '';

        // 不能设置两个相同的namespace
        const namespaces = LightStorage._namespaces.get(_storage) || []

        if (namespaces.includes(namespace)) {
            throw new Error(`you cannot set two identical namespaces: "${namespace}"`);
        }


        if (_config) {
            if (namespace) {
                // namespace 中不能能包含 NAMESPACE_DIVIDE
                if (namespace.includes(NAMESPACE_DIVIDE)) {
                    throw new Error(`cannot include "${NAMESPACE_DIVIDE}" in namespace:${namespace}`);
                }
            }

            const {
                encode,
                decode,
                encodeKey,
                decodeKey,
            } = _config;


            if ((encodeKey && !decodeKey) || (!encodeKey && decodeKey)) {
                throw new Error('encodeKey and decodeKey must be both');
            }

            if ((encode && !decode) || (!encode && decode)) {
                throw new Error('encode and decode must be both');
            }
        }

        namespaces.push(namespace);

        LightStorage._namespaces.set(_storage, namespaces)
    }

    protected _triggerListener(key: string, oldValue: any, newValue: any): void {
        if (this._listener[key]) {
            for (const listener of this._listener[key]) {
                listener(oldValue, newValue);
            }
        }
    }

    protected _encode(data: any): string {
        if (typeof data === 'symbol') {
            throw new Error('cannot support symbol!');
        }
        if (typeof data === 'bigint') {
            throw new Error('cannot support bigint!');
        }

        if (typeof data === 'number' && Number.isNaN(data)) {
            data = NAN;
        } else if (typeof data === 'undefined') {
            data = UNDEFINED;
        } else {
            data = JSON.stringify(data);
        }

        if (this._config?.encode) {
            return this._config.encode(data);
        }

        return data;
    };

    protected _decode(data: string): any {
        if (this._config?.decode) {
            data = this._config.decode(data);
        }

        if (data === NAN) {
            return NaN;
        }

        if (data === UNDEFINED) {
            return undefined;
        }

        return JSON.parse(data);
    };

    protected _encodeTitle(data: string): string {
        if (!data) {
            throw new Error(`key cannot be empty!`);
        }
        if (data.includes(NAMESPACE_DIVIDE)) {
            throw new Error(`cannot include "${NAMESPACE_DIVIDE}" in key: "${data}"`);
        }
        if (this._config?.encodeKey) {
            data = this._config?.encodeKey(data);
        }

        if (this._config?.namespace) {
            data = this._config?.namespace + NAMESPACE_DIVIDE + data;
        }

        return data;
    };

    protected _decodeTitle(data: string): string {

        const divideIndex = data.indexOf(NAMESPACE_DIVIDE);

        data = (() => {
            if (this._config?.namespace) {
                if (divideIndex > 0 && this._config?.namespace == data.slice(0, divideIndex)) {
                    return data.slice(divideIndex + 1);
                }
            } else {
                if (divideIndex <= 0) {
                    return data;
                }
            }
            return '';
        })();

        if (data && this._config?.decodeKey) {
            return this._config?.decodeKey(data);
        }


        return data;
    };

    get<T = any>(key: string): T | null {
        const v = this._storage.getItem(this._encodeTitle(key));

        if (v === null) {
            return null;
        }

        return this._decode(v);
    }

    set<T = any>(key: string, val: T): T {
        const oldValue = this.get(key);
        this._storage.setItem(this._encodeTitle(key), this._encode(val));
        this._triggerListener(key, oldValue, val);
        return val;
    }

    remove<T = any>(key: string): T | null {
        const oldValue = this.get(key);
        this._storage.removeItem(this._encodeTitle(key));
        this._triggerListener(key, oldValue, null);
        return oldValue;
    }

    clear(): void {

        const oldMap = this.getAll();

        // 没有命名空间的情况下使用storage.clear()优化性能
        const namespaces = LightStorage._namespaces.get(this._storage)
        if ( namespaces?.length === 1 && namespaces[0] === "") {
            this._storage.clear();
            for (const key in this._listener) {
                const oldValue = key in oldMap ? oldMap[key] : null;
                this._triggerListener(key, oldValue, null);
            }
        } else {
            const keys = this.keys();
            for (const key of keys) {
                this.remove(key);
            }
        }


    }

    listen<T = any>(key: string, listener: Listener<T>): void {
        if (!this._listener[key]) {
            this._listener[key] = [];
        }
        this._listener[key].push(listener);
    }

    unListen<T = any>(key: string, listener: Listener<T>): void {
        const listeners = this._listener[key]
        if (listeners && listeners.length > 0) {
            const a = listeners.find(item => item === listener)
            this._listener[key] = listeners.filter(item => item !== listener);
        }
    }

    size(): number {
        let size = 0;
        this.eachKey(() => size++);
        return size;
    }

    keys(): string[] {
        const keys: string[] = [];
        this.eachKey(key => keys.push(key));
        return keys;
    }

    eachKey(callback: (key: string) => void): void {
        const length = this._storage.length;
        for (let i = 0; i < length; i++) {
            const sourceKey = this._storage.key(i);
            if (sourceKey) {
                const key = this._decodeTitle(sourceKey);
                if (key) {
                    callback(key);
                }
            }
        }
    }

    each(callback: (key: string, value: any) => void): void {
        this.eachKey(key => {
            callback(key, this.get(key));
        });
    }

    getAll<T extends Record<string, any>>(): T {
        const all: Record<string, any> = {};
        this.each((key, value) => all[key] = value);
        return all as T;
    }

    setAll<T extends Record<string, any>>(data: T): T {
        for (const key in data) {
            this.set(key, data[key]);
        }
        return data;
    }
}

export class LightSimpleStorage<T> {
    constructor(private _key: string, private _storage: LightStorage) {
    }

    get(): T | null {
        return this._storage.get<T>(this._key);
    };

    set(data: T): T {
        return this._storage.set<T>(this._key, data);
    };

    remove(): T | null {
        return this._storage.remove(this._key);
    };

    listen(listener: Listener<T>) {
        return this._storage.listen(this._key, listener);
    };

    unListen(listener: Listener<T>) {
        return this._storage.unListen(this._key, listener);
    };
}

export function createGenerator(lightStorage: LightStorage)  {
    return <T = any>(key: string): LightSimpleStorage<T> => new LightSimpleStorage<T>(key, lightStorage);
}


interface StorageFn {

    // LightStorage.getAll()
    <T extends Record<string, any>>(): T;

    // LightStorage.clear()
    (clear: null): void;

    // LightStorage.setAll()
    <T extends Record<string, any>>(data: T): T;

    // LightStorage.each()
    (callback: (key: string, value: any) => void): void;

    // LightStorage.get()
    <T = any>(key: string): T | null;

    // LightStorage.set()
    <T = any>(key: string, data: T): T;

    // LightStorage.remove()
    <T = any>(key: string, data: null): T | null;

}

export function createFunction(lightStorage: LightStorage): StorageFn {

    return function (...args: any[]): any {
        const [arg1, arg2] = args
        if(args.length === 0){
            return lightStorage.getAll();
        }else if (args.length === 1) {

            if (arg1 === null) {
                return lightStorage.clear();
            }

            if (typeof arg1 === 'object' && arg1 && Object.keys(arg1).length > 0) {
                return lightStorage.setAll(arg1);
            }

            if (typeof arg1 === 'function') {
                return lightStorage.each(arg1);
            }

            if (typeof arg1 === 'string') {
                return lightStorage.get(arg1);
            }
        }else if(args.length === 2) {
            if (typeof arg1 === 'string') {

                if (arg2 === null) {
                    return lightStorage.remove(arg1);
                }

                return lightStorage.set(arg1, arg2);
            }
        }
    };
}





