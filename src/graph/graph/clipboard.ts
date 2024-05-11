import {ref} from "vue";

let dataArr = ref<any>([])

export const pushData = (data: any) => {
    dataArr.value.push(data)
}

export const popData = () => {
    return dataArr.value.pop()
}
