module farm_aptos::deserializer {

    use std::from_bcs;
    /// 游标结构，用于逐个读取 vector<u8> 的内容
    struct Cursor has copy, drop, store {
        data: vector<u8>,
        pos: u64,
    }

    public fun new_cursor(data: vector<u8>): Cursor {
        Cursor { data, pos: 0 }
    }

    public fun is_end(self: &Cursor): bool {
        self.pos >= self.data.length()
    }

    public fun next(self: &mut Cursor): u8 {
        let len = self.data.length();
        let pos = self.pos;
        assert!(pos < len, 0x100);
        let ch = self.data[pos];
        self.pos = pos + 1;
        ch
    }

    public fun peek(self: &Cursor): u8 {
        let len = self.data.length();
        let pos = self.pos;
        assert!(pos < len, 0x101);
        self.data[pos]
    }

    public fun reset(cursor: &mut Cursor) {
        cursor.pos = 0;
    }

    fun bytes(self: &mut Cursor, n: u64): vector<u8> {
        let len = self.data.length();
        let pos = self.pos;
        assert!(pos + n <= len, 0x102);
        let result = vector<u8>[];
        let end = pos + n;
        let i = pos;
        while (i < end) {
            result.push_back(self.data[i]);
            i += 1;
        };
        self.pos = end;
        result
    }

    /// 读取 ULEB128 编码的 u32
    public fun read_uleb128_u32(self: &mut Cursor): u32 {
        let value: u64 = 0;
        let shift = 0;
        let max_u32: u64 = 0xffffffff;
        let max_shift: u8 = 28; // 最多5字节

        while (true) {
            let byte = self.read_u8();
            let part = (byte & 0x7f) as u64;
            value |= (part << shift);

            if ((byte & 0x80) == 0) {
                break;
            };
            shift += 7;
            assert!(shift <= max_shift, 0x200); // 防止死循环
        };

        assert!(value <= max_u32, 0x201); // 溢出检查
        value as u32
    }

    public fun read_u8(self: &mut Cursor): u8 {
        let ch = self.bytes(1);
        from_bcs::to_u8(ch)
    }

    public fun read_u16(self: &mut Cursor): u16 {
        let bytes = self.bytes(2);
        from_bcs::to_u16(bytes)
    }

    public fun read_u32(self: &mut Cursor): u32 {
        let bytes = self.bytes(4);
        from_bcs::to_u32(bytes)
    }

    public fun read_u64(self: &mut Cursor): u64 {
        let bytes = self.bytes(8);
        from_bcs::to_u64(bytes)
    }

    public fun read_u128(self: &mut Cursor): u128 {
        let bytes = self.bytes(16);
        from_bcs::to_u128(bytes)
    }

    public fun read_u256(self: &mut Cursor): u256 {
        let bytes = self.bytes(32);
        from_bcs::to_u256(bytes)
    }

    public fun read_address(self: &mut Cursor): address {
        let bytes = self.bytes(32);
        from_bcs::to_address(bytes)
    }

    public fun read_bool(self: &mut Cursor): bool {
        let byte = self.bytes(1);
        from_bcs::to_bool(byte)
    }

    public fun read_string(self: &mut Cursor): std::string::String {
        let len = self.read_uleb128_u32();
        let bytes = self.bytes(len as u64);
        from_bcs::to_string(bytes)
    }

    public fun read_bytes(self: &mut Cursor): vector<u8> {
        let len = self.read_uleb128_u32();
        self.bytes(len as u64)
    }

}

