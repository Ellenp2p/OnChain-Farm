script {
    use farm_aptos::farm_aptos;

    fun main(sender: &signer, data: vector<u8>){
        farm_aptos::register_crop(
            sender,
            data
        );
    }
}