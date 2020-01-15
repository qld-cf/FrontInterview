/**
 * 手写ajax、封装fetch
 */

/**
 * `fetch`请求
 * @dec learn：https://developer.mozilla.org/zh-CN/docs/Web/API/Fetch_API
 * @param {'GET'|'POST'} method 请求方法
 * @param {string} url 请求路径
 * @param {object} data 请求参数对象
 * @param {number} timeout 超时毫秒
 */
function myFetch(method, url, data = {}, timeout = 5000) {
  let dataPost = null;
  let dataGet = '';
  switch (method) {
    case 'POST':
      // 若后台没设置接收 JSON 则不行 需要跟 GET 一样的解析对象传参
      dataPost = JSON.stringify(data);
      break;

    case 'GET':
      // 解析对象传参
      for (const key in data) {
        dataGet += `&${key}=${data[key]}`;
      }
      if (dataGet) {
        dataGet = '?' + dataGet.slice(1);
      }
      break;
  }
  return new Promise((resolve, reject) => {
    fetch(url + dataGet, {
      // credentials: 'include',  // 携带cookie配合后台用
      // mode: 'cors',            // 貌似也是配合后台设置用的跨域模式
      method: method,
      headers: {
        /**
         * 通常为`application/json`因为等下我要请求豆瓣的接口
         * 所以这里用`application/x-www-form-urlencoded`
        */
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: dataPost
    }).then(response => {
      // 把响应的信息转为`json`
      return response.json();
    }).then(res => {
      resolve(res);
    }).catch(error => {
      reject(error);
    });
    setTimeout(reject.bind(this, 'fetch is timeout'), timeout);
  });
}

function fetchRequest() {
  // 这里是豆瓣的接口
  theFetch('GET', 'https://douban.uieee.com/v2/movie/top250', {
    start: 1,
    count: 5
  }).then(res => {
    console.log('Fetch success', res);
  }).catch(err => {
    console.warn('Fetch fail', err);
  })
}

/**
 * `XMLHttpRequest`请求
 * @dec learn: https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest
 * @param {object} param 传参对象
 * @param {string} param.url 请求路径
 * @param {'GET'|'POST'} param.method 请求方法：这里我只枚举了常用的两种
 * @param {object} param.data 传参对象
 * @param {FormData} param.file 上传图片`FormData`对象
 * @param {number} param.overtime 超时检测毫秒数
 * @param {(result?: any) => void} param.success 成功回调
 * @param {(error?: XMLHttpRequest) => void} param.fail 失败回调
 * @param {(info?: XMLHttpRequest) => void} param.timeout 超时回调
 * @param {(e?: ProgressEvent<XMLHttpRequestEventTarget>) => void} param.progress 进度回调 貌似没什么用
 */
function myAjax(param) {
  if (typeof param !== 'object') return console.error('ajax 缺少请求传参');
  if (!param.method) return console.error('ajax 缺少请求类型 GET 或者 POST');
  if (!param.url) return console.error('ajax 缺少请求 url');
  if (typeof param.data !== 'object') return console.error('请求参数类型必须为 object');

  /** XMLHttpRequest */
  const XHR = new XMLHttpRequest();
  /** 请求方法 */
  const method = param.method;
  /** 超时检测 */
  const overtime = typeof param.overtime === 'number' ? param.overtime : 0;
  /** 请求链接 */
  let url = param.url;
  /** POST请求传参 */
  let dataPost = null;
  /** GET请求传参 */
  let dataGet = '';

  // 传参处理
  switch (method) {
    case 'POST':
      // 若后台没设置接收 JSON 则不行 需要跟 GET 一样的解析对象传参
      dataPost = JSON.stringify(param.data);
      break;

    case 'GET':
      // 解析对象传参
      for (const key in param.data) {
        dataGet += '&' + key + '=' + param.data[key];
      }
      if (dataGet) {
        dataGet = '?' + dataGet.slice(1);
        url += dataGet;
      }
      break;
  }

  // 监听请求变化
  // XHR.status learn: http://tool.oschina.net/commons?type=5
  XHR.onreadystatechange = function () {
    if (XHR.readyState !== 4) return;
    if (XHR.status === 200 || XHR.status === 304) {
      if (typeof param.success === 'function') param.success(JSON.parse(XHR.response));
    } else {
      if (typeof param.fail === 'function') param.fail(XHR);
    }
  }

  // 判断请求进度
  if (param.progress) {
    XHR.addEventListener('progress', param.progress, false);
  }

  // XHR.responseType = 'json';
  // 是否Access-Control应使用cookie或授权标头等凭据进行跨站点请求。
  // XHR.withCredentials = true;
  XHR.open(method, url, true);

  // 判断是否上传文件通常用于上传图片，上传图片时不需要设置头信息
  if (param.file) {
    dataPost = param.file;
  } else {
    /**
     * @example
     * XHR.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded')
     * XHR.setRequestHeader('Content-Type', 'application/json')
     */
    XHR.setRequestHeader('Content-Type', 'application/json');
  }

  // 在IE中，超时属性只能在调用 open() 方法之后且在调用 send() 方法之前设置。
  if (overtime > 0) {
    XHR.timeout = overtime;
    XHR.ontimeout = function () {
      console.warn('ajax 请求超时 !!!');
      XHR.abort();
      if (typeof param.timeout === 'function') param.timeout(XHR);
    }
  }

  XHR.send(dataPost);
}

// 简洁版
function smallAjax(method, url, data, success, fail) {
  const XHR = new XMLHttpRequest();
  /** 请求参数 */
  let sendData = '';
  // 解析对象传参
  for (const key in data) {
    sendData += '&' + key + '=' + data[key];
  }
  switch (method) {
    case 'GET':
      url = sendData ? `${url}?${sendData}` : url;
      sendData = null;
      break;

    case 'POST':
      if (sendData) {
        sendData = sendData.slice(1);
      }
      break;
  }
  XHR.onreadystatechange = function () {
    if (XHR.readyState !== 4) return;
    if (XHR.status === 200 || XHR.status === 304) {
      if (typeof success === 'function') success(XHR.response);
    } else {
      if (typeof fail === 'function') fail(XHR);
    }
  }
  XHR.open(method, url, true);
  XHR.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
  XHR.send(sendData);
}

// 应用

const BASEURL = 'http://che.qihao.lzei.com';
function ajaxRequest() {
  const error = {
    message: '',
    info: null
  }
  myAjax({
    url: BASEURL + '/api/app/parking',
    method: 'post',
    data: {
      appkey: 'e2fb20ea3f3df33310788a4247834c93',
      token: '2a11d6d67a8b8196afbcefbac3e0a573',
      page: '1',
      limit: '7',
      longitude: '113.30764968',
      latitude: '23.1200491',
      sort: 'distance',
      order: 'asc',
      keyword: ''
    },
    overtime: 5000,
    success: function (res) {
      console.log('请求成功', res);
    },
    fail: function (err) {
      error.message = '接口报错，请看 network';
      error.info = err;
      if (err.response.charAt(0) == '{') {
        error.info = JSON.parse(err.response);
      }
      console.log('请求失败', error);
    },
    timeout: function (info) {
      error.message = '请求超时';
      error.info = info;
      console.log(error);
    },
    progress: function (e) {
      if (e.lengthComputable) {
        let percentComplete = e.loaded / e.total
        console.log('请求进度', percentComplete, e.loaded, e.total);
      }
      console.log(e);
    }
  });
}
