export const reduceSigFigs = (value: number) => {
    return Math.round(value * 100000) / 100000
}
export const arrayReduceSigFigs = (value: number[]) => {
    return value.map(el => reduceSigFigs(el))
}

export function random_id(length: number) {
    var result = '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() *
            charactersLength));
    }
    return result;
}
