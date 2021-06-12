const STATE = {
  PENDING: 'PENDING',
  FULFILLED: 'FULFILLED',
  REJECTED: 'REJECTED',
}

class OwnPromise {
  constructor(callback){
    this.state = STATE.PENDING;
    this.value = undefined;
    this.handlers = [];
    try{
      callback(this._resolve,this._reject);
    }catch (error) {
      this._reject(error)
    }
  }
  _resolve = (val) =>{
    this.updateResult(val,STATE.FULFILLED);
  }
  _reject = (val) => {
    this.updateResult(val,STATE.REJECTED);
  }
  updateResult = (val,state) => {
      setTimeout(()=>{
        if (this.state !== STATE.PENDING) {
          return;
        }

        if(isThenable(val)){
          return val.then(this._resolve,this._reject);
        }

        this.value = val;
        this.state = state;
        this.executeHandlers();
      },0)
  }
  executeHandlers = () => {
    if(this.state === STATE.PENDING){
      return null;
    }
    this.handlers.forEach((handler) => {
      if (this.state === STATE.FULFILLED) {
        return handler.onSuccess(this.value);
      } 
      return handler.onFail(this.value);
    })
    this.handlers = [];

  }
  addHandlers(handlers) {
    this.handlers.push(handlers);
    this.executeHandlers();
  }
  static all =(val) =>{
    return new OwnPromise((res, rej) => {
      let results = [];
      let completed = 0;
      val.forEach((value, index) => {
        value.then(function (value) {
          results[index] = value;
          completed += 1;
          if(completed === val.length) {
            res(results);
          }
        }).catch(function (error) {
          rej(error);
        });  
      })

    })
  }
  then(onSuccess,onFail){
    return new OwnPromise((res, rej) => {
      this.addHandlers({
        onSuccess:function(val){
          if (!onSuccess) {
            return res(val);
          }
          try{
            return res(onSuccess(val))
          }catch (err){
            return rej(err)
          }
        },
        onFail:function(val){

          if (!onFail) {
            return rej(val);
          }
          try {
            return res(onFail(val))
          } catch(err) {
            return rej(err);
          }
        }
      })
    })
  }
  catch(onFail){
      this.then(null,onFail)
  }
  finally(callback){
    return new OwnPromise((res, rej) => {
      let val;
      let wasRejected;
      this.then((value) => {
        wasRejected = false;
        val = value;
        return callback();
      }, (err) => {
        wasRejected = true;
        val = err;
        return callback();
      }).then(() => {
        if(!wasRejected) {
          return res(val);
        } 
        return rej(val);
      })
   })
  }
}

function isThenable(value) {
  if (typeof value === "object" && value !== null && value.then && typeof value.then === "function") {
    return true;
  }
  return false;
}

function ajax(url,config) {
  const reg = new RegExp('^(https?:\\/\\/)?'+
  '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ 
  '((\\d{1,3}\\.){3}\\d{1,3}))'+
  '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ 
  '(\\?[;&a-z\\d%_.~+=-]*)?'+
  '(\\#[-a-z\\d_]*)?$','i');
  const types = ["GET","POST","HEAD","PUT","DELETE","CONNECT","OPTIONS","TRACE","PATCH"];
  const res = new OwnPromise((res,rej) => {
    console.log(reg.test(url));
    if(reg.test(url) && types.find(el => el === config.type)){
        const xhr = new XMLHttpRequest;
        try{
          xhr.open(config.type,url);
          xhr.onload = function() {
            if(xhr.readyState == XMLHttpRequest.DONE && xhr.status == 200) {
              res(xhr.responseText)
            }else{
              rej("error somthing")
            }
        }
          xhr.send();
        
        }catch(err){
          rej(err);
        }
    }else{
      rej("error ch@mtav");
    }
  })
  return res;
}
ajax("https://jsonplaceholder.typicode.com/posts",{type:'GET',headers:{},data:{}}).then((res) => {
  console.log(res);
}).catch(err => {
  console.log(err)
})
const res = new OwnPromise((res,rej) => {
    res({data:1,resf:[1,2,3,4,5]})
});
res.then((res) => {
  console.log(res);
})
const allres = OwnPromise.all([fetch('https://jsonplaceholder.typicode.com/posts'),
fetch('https://jsonplaceholder.typicode.com/comments'),fetch('https://jsonplaceholder.typicode.com/photos')]).then(res => {
  console.log(res);
}).catch(err => {
  console.log(err)
});
