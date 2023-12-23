declare module "ufetch" {
  export namespace ufetch {
    function setCookie(key: string, value: string, expiry: number): void;
    function getCookie(key: string): string;

    function post(path: string, data: any, options?: any);
    function get(path: string, options?: any);
    function put(path: string, data: any, options?: any);
    function _delete(path: string, data: any, options?: any);

    export { _delete as delete, setCookie, getCookie, post, get, put };
  }
}
