module farm_aptos::farm_aptos {
    use std::signer;
    use std::option;
    use std::vector;
    use std::bcs;
    use aptos_framework::object;
    use aptos_framework::smart_table;
    use aptos_framework::timestamp;

    use farm_aptos::deserializer;

    /// 地块上的作物实例
    /// 对应前端 `CropInstance`
    struct CropInstance has store, drop {
        // 作物类型ID
        crop_type_id: vector<u8>,
        // 播种时间
        planted_at_sec: u64,
        // 是否浇水
        watered: bool,
    }

    // 作物注册表
    struct CropRegistry has key {
        crops: smart_table::SmartTable<vector<u8>, CropKind>,
    }

    // 作物类型表
    enum CropKind has store, drop, copy {
        // v1 标准作物
        V1Crop {
            // 作物类型 ID
            id: vector<u8>,
            // 作物名称
            name: vector<u8>,
            // 作物描述
            description: vector<u8>,
            // 作物图片
            image: vector<u8>,
            // 成熟时间
            mature_time: u64,
            // 产量
            yield: u64,
            // 种子价格
            seed_price: u64,
            // 作物价格
            crop_price: u64,
        }
    }

    /// 物品项，对应前端 `InventoryItem`
    struct InventoryItem has store, drop, copy {
        // 作物类型 ID
        crop_type_id: vector<u8>,
        // 数量
        quantity: u64,
    }

    /// 单个地块
    /// 对应前端 `PlotTile`
    struct PlotTile has store, drop {
        id: u64,
        crop: option::Option<CropInstance>,
    }

    /// 玩家农场状态
    /// 对应前端 `GameStateSnapshot`
    struct Farm has key {
        gold: u64,
        plots: vector<vector<PlotTile>>,
        inventory_seed: smart_table::SmartTable<vector<u8>, InventoryItem>,
        inventory_produce: smart_table::SmartTable<vector<u8>, InventoryItem>,
    }

    struct ObjectRef has key {
        extend_ref: object::ExtendRef,
        transfer_ref: object::TransferRef,
    }

    fun init_module(contract: &signer) {
        // 初始化合约
        move_to(contract, CropRegistry {
            crops: smart_table::new(),
        });
    }

    // 通过地址和前缀获取种子
    public fun get_seed (prefix: vector<u8>): vector<u8> {
        let seed = vector::empty<u8>();
        seed.append(bcs::to_bytes(&@farm_aptos));
        seed.append(prefix);
        seed
    }

    /// 初始化玩家农场
   fun init_farm(owner: &signer, rows: u64, cols: u64) {
        
        let address: address = object::create_object_address(
            &signer::address_of(owner), get_seed( b"farm")
        );
        
        if( object::object_exists<Farm>(address) ){
            return ;
        }else {
            let farm_cref = &object::create_named_object(
                owner,
                get_seed( b"farm"),
            );
            let farm_ref = ObjectRef {
                extend_ref: object::generate_extend_ref(farm_cref),
                transfer_ref: object::generate_transfer_ref(farm_cref),
            };

            move_to(&object::generate_signer(farm_cref), farm_ref);

            object::disable_ungated_transfer(&object::generate_transfer_ref(farm_cref));

            let plots = vector[];

        for(i in 0..rows){
            let row_vec = vector::empty<PlotTile>();
            for(j in 0..cols){
                let plot_id = i * cols + j;
                let plot_tile = PlotTile {
                    id: plot_id,
                    crop: option::none(),
                };
                row_vec.push_back(plot_tile);
            };
            plots.push_back(row_vec);
        };

        let farm = Farm {
            gold: 10,
            plots,
            inventory_seed: smart_table::new(),
            inventory_produce: smart_table::new(),
        };

        move_to(&object::generate_signer(farm_cref), farm);
        };
        

        
    }

    inline fun get_farm_ref(owner: address): &mut Farm {
        let farm_object = get_farm_address(owner);
        assert!(farm_object.is_some(), 1);
        &mut Farm[object::object_address(farm_object.borrow())]
    }

    inline fun get_farm_address(owner: address): option::Option<object::Object<Farm>> {
        let address = object::create_object_address(
            &owner,
            get_seed( b"farm"),
        );
        if( object::object_exists<Farm>(address) ){
            option::some(object::address_to_object(address))
        }else {
            option::none()
        }
    }

    /// 播种：在指定地块种下指定作物
    public entry fun plant(owner: &signer, x: u64, y: u64, crop_type_id: vector<u8>) acquires Farm {
        // TODO: 校验库存并写入作物实例
        let farm = get_farm_ref(signer::address_of(owner));
        let plot_tile = &mut farm.plots[x][y];
        assert!(plot_tile.crop.is_none(), 2);

        // 检查作物种子是否存在
        assert!(farm.inventory_seed.contains(crop_type_id), 3);

        let inventory_item = farm.inventory_seed.borrow_mut(crop_type_id);

        // 检查库存数量
        assert!(inventory_item.quantity > 0, 5);

        // 扣除库存
        inventory_item.quantity -= 1;

        // 检查库存，如果为空则清除
        if( inventory_item.quantity == 0 ){
            farm.inventory_seed.remove(crop_type_id);
        };

        // 写入地块
        let crop_instance = CropInstance {
            crop_type_id,
            planted_at_sec: timestamp::now_seconds(),
            watered: false,
        };

        plot_tile.crop = option::some(crop_instance);
    }

    /// 浇水：标记作物已浇水
    public entry fun water(owner: &signer, x: u64, y: u64) acquires Farm {
        // TODO: 将地块作物 watered 设为 true
        let farm = get_farm_ref(signer::address_of(owner));
        let plot_tile = &mut farm.plots[x][y];
        assert!(plot_tile.crop.is_some(), 2);
        let crop_instance = plot_tile.crop.borrow_mut();
        crop_instance.watered = true;
    }

    /// 收获：成熟校验并获得产物
    public entry fun harvest(owner: &signer, x: u64, y: u64) acquires Farm, CropRegistry {
        // TODO: 清空作物并发放产物
        let farm = get_farm_ref(signer::address_of(owner));
        let plot_tile = &mut farm.plots[x][y];
        assert!(plot_tile.crop.is_some(), 2);

        // 检查作物是否浇水
        let crop_instance = plot_tile.crop.borrow_mut();
        assert!(crop_instance.watered, 3);

        // 清空地块
        let crop_instance = plot_tile.crop.extract();

        // 发放产物

        // 检查产量
        let crop_registry =  & CropRegistry[@farm_aptos].crops;
            // 从全局作物注册表中获取作物类型
            assert!(crop_registry.contains(crop_instance.crop_type_id));
            let crop_type = crop_registry.borrow(crop_instance.crop_type_id);
            match (crop_type){
                CropKind::V1Crop {
                    mature_time,
                    yield,
                    ..
                } => {

                    // 检查作物是否成熟
                    let now = timestamp::now_microseconds();
                    let planted_at_sec = crop_instance.planted_at_sec;
                    let elapsed_sec = now - planted_at_sec;
                    assert!(elapsed_sec > *mature_time, 4);

                    // 发放产物
                    if( farm.inventory_produce.contains(crop_instance.crop_type_id) ){
                        let inventory_item = farm.inventory_produce.borrow_mut(crop_instance.crop_type_id);
                        inventory_item.quantity += *yield;
                    }else { 
                        let inventory_item = InventoryItem {
                            crop_type_id: crop_instance.crop_type_id,
                            quantity: *yield,
                        };
                        farm.inventory_produce.add(crop_instance.crop_type_id, inventory_item);
                    }
                },
            }
    }

    /// 购买种子：扣金币并增加库存
    public entry fun buy_seed(owner: &signer, crop_type_id: vector<u8>, qty: u64) acquires Farm, CropRegistry {
        // TODO: 扣减 gold，新增/累加 inventory(kind=0)
        let farm = get_farm_ref(signer::address_of(owner));

        // 查看种子价格
        let crop_registry =  & CropRegistry[@farm_aptos].crops;
        assert!(crop_registry.contains(crop_type_id), 64);
        let crop_type = crop_registry.borrow(crop_type_id);
        match (crop_type){
            CropKind::V1Crop {
                seed_price,
                ..
            } => {

                // 检查金币是否足够
                assert!(farm.gold >= *seed_price * qty, 2);
                // 扣除金币
                farm.gold -= *seed_price * qty;

                if( farm.inventory_seed.contains(crop_type_id) ){
                    let inventory_item = farm.inventory_seed.borrow_mut(crop_type_id);
                    inventory_item.quantity += qty;
                }else {
                    // 新增库存
                    let inventory_item = InventoryItem {
                        crop_type_id,
                        quantity: qty,
                    };
                    farm.inventory_seed.add(crop_type_id, inventory_item);
                }
            },
        };
    }

    /// 出售产物：减库存并增加金币
    public entry fun sell_produce(owner: &signer, crop_type_id: vector<u8>, qty: u64) acquires Farm, CropRegistry {
        // TODO: 扣减 inventory(kind=1)，增加 gold
        let farm = get_farm_ref(signer::address_of(owner));
        assert!(farm.inventory_produce.contains(crop_type_id), 2);
        let inventory_item = farm.inventory_produce.borrow_mut(crop_type_id);
        assert!(inventory_item.quantity >= qty, 4);

        // 扣除库存
        inventory_item.quantity -= qty;

        // 检查库存，如果为空则清除
        if( inventory_item.quantity == 0 ){
            farm.inventory_produce.remove(crop_type_id);
        };

        // 查看作物价格
        let crop_registry =  & CropRegistry[@farm_aptos].crops;
        assert!(crop_registry.contains(crop_type_id));
        let crop_type = crop_registry.borrow(crop_type_id);
        match (crop_type){
            CropKind::V1Crop {
                crop_price,
                ..
            } => {  
                // 增加金币
                farm.gold += *crop_price * qty;
            },
        };
    }

    public entry fun init(owner: &signer){
        init_farm(owner, 5, 5);
    }

    /// 从好友地块偷取（演示接口）
    public entry fun steal(_thief: &signer, _friend: address, _plot_id: vector<u8>) {
        // TODO: 校验作物成熟，从好友地块转移一份产物到小偷库存
    }

    
    #[view]
    /// 读取自己农场快照（只定义接口；可改用 view 函数模块单独暴）
    public fun get_my_farm(owner: address): vector<u8> acquires Farm{
        // TODO: 视图函数占位（可改为 aptos-views）
        if( get_farm_address(owner).is_none() ){
            return vector[];
        };

        let farm = get_farm_ref(owner);
        let inventory_seed = farm.inventory_seed.to_simple_map();
        let inventory_produce = farm.inventory_produce.to_simple_map();

        let vec = bcs::to_bytes(&farm.gold);
        vec.append(bcs::to_bytes(&farm.plots));
        vec.append(bcs::to_bytes(&inventory_seed));
        vec.append(bcs::to_bytes(&inventory_produce));

        vec

    }


    #[test]
    fun main(){
        use std::from_bcs;
        std::debug::print(&
            from_bcs::to_bytes(vector[1, 1])
        );

    }

    // admin
    public fun register_crop(sender: &signer, data: vector<u8>): CropKind acquires CropRegistry {
        assert!(
            signer::address_of(sender) == @farm_aptos || 
                object::is_owner(
                object::address_to_object<object::ObjectCore>(@farm_aptos),
                signer::address_of(sender)
            ), 
        0x100);

        let cursor = deserializer::new_cursor(data);
        let type = cursor.read_uleb128_u32();
        let crop = if (type == 0){
            CropKind::V1Crop {
                id: cursor.read_bytes(),
                // 作物名称
                name: cursor.read_bytes(),
                // 作物描述
                description: cursor.read_bytes(),
                // 作物图片
                image: cursor.read_bytes(),
                // 成熟时间
                mature_time: cursor.read_u64(),
                // 产量
                yield: cursor.read_u64(),
                // 种子价格
                seed_price: cursor.read_u64(),
                // 作物价格
                crop_price: cursor.read_u64(),
            }
        }else {
            abort 0
        };
        let crop_type = crop.id;
        CropRegistry[@farm_aptos].crops.add(crop_type, crop);
        crop
    }


    #[view]
    public fun get_registry(): std::simple_map::SimpleMap<vector<u8>, CropKind> acquires CropRegistry {
        let crop_registry = CropRegistry[@farm_aptos].crops.to_simple_map();
        crop_registry
    }

    #[view]
    public fun get_registry_crop(id: vector<u8>): option::Option<CropKind> acquires CropRegistry {
        if(CropRegistry[@farm_aptos].crops.contains(id)){
            return option::some(*CropRegistry[@farm_aptos].crops.borrow(id));
        }else {
            return option::none();
        };
        abort 0
    }
}
