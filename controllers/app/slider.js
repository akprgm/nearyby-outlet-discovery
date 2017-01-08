var utility = require('../utility');
module.exports = {
    sliderFun : function(response){
        let arr = new Array();
        let obj1 ={
            outlet_id : '582d74d0136ff74d38d7f2ac',
            outlet_name : 'Monte Carlo',
            cover_image : 'http://139.59.9.219/public/assets/gallery/cloth/cover_images_500/1464252282monte-carlo--(west-gate)-rajouri-garden-(5).jpg',
            categoryType : 'cloth',
            location : 'West Gate, Rajouri Garden'
        }
        let obj2 = {
            outlet_id : '582d74d0136ff74d38d7f5a5',
            outlet_name : 'Fila',
            cover_image : 'http://139.59.9.219/public/assets/gallery/cloth/cover_images_500/1471342169fila-pacific-mall-anand-vihar-(1).jpg',
            categoryType : 'cloth',
            location :'Kaushambi',
        }
        let obj3 = {
            outlet_id : '582d74d0136ff74d38d7e1f4',
            outlet_name : 'Om Book Shop',
            cover_image : 'http://139.59.9.219/public/assets/gallery/book/cover_images_full/1464333308om-book-shop-1-metropolitan.jpg',
            categoryType : 'book',
            location : 'Gurgaon'
        } 
        let obj4 = {
            outlet_id : '582d74d0136ff74d38d7f8c4',
            outlet_name : 'Sargam Electronics',
            cover_image : 'http://139.59.9.219/public/assets/gallery/consumer/cover_images_500/1465290089sargam-noida-(sec-18).jpg',
            categoryType : 'consumer',
            location : 'Sector 18, Noida',
        }
        let obj5 = {
            outlet_id : '582d74d0136ff74d38d7fb41',
            outlet_name :'Kapoor Watch Co.',
            cover_image : 'http://139.59.9.219/public/assets/gallery/watch/cover_images_500/1464161396kapoor-watch-co.-ambi-gurg2.jpg',
            categoryType :'watch',
            location  : 'Ambience Mall, Gurgaon'
        }
        arr.push(obj1,obj2,obj3,obj4,obj5);
        let responseObj = {
            status :true,
            message: arr
        }
        response.send(responseObj);
    }
}