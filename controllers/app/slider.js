var utility = require('../utility');
module.exports = {
    sliderFun : function(response){
        let arr = new Array();
        let obj1 ={
            outlet_id : '4598',
            outlet_name : 'Monte Carlo',
            cover_image : 'https://www.faagio.com/gallery/shopping-cloth/1464252282monte-carlo--(west-gate)-rajouri-garden-(5).jpg',
            categoryType : 'shopping-cloth',
            location : 'West Gate, Rajouri Garden'
        }
        let obj2 = {
            outlet_id : '5385',
            outlet_name : 'Fila',
            cover_image : 'https://www.faagio.com/gallery/shopping-cloth/1471342169fila-pacific-mall-anand-vihar-(1).jpg',
            categoryType : 'shopping-cloth',
            location :'Kaushambi',
        }
        let obj3 = {
            outlet_id : '175',
            outlet_name : 'Om Book Shop',
            cover_image : 'https://www.faagio.com/gallery/shopping-book/mobileApp/1464333308om-book-shop-1-metropolitan.jpg',
            categoryType : 'shopping-book',
            location : 'Gurgaon'
        } 
        let obj4 = {
            outlet_id : '171',
            outlet_name : 'Sargam Electronics',
            cover_image : 'https://www.faagio.com/gallery/shopping-consumer/mobileApp/1465290089sargam-noida-(sec-18).jpg',
            categoryType : 'shopping-consumer',
            location : 'Sector 18, Noida',
        }
        let obj5 = {
            outlet_id : '109',
            outlet_name :'Kapoor Watch Co.',
            cover_image : 'https://www.faagio.com/gallery/shopping-watch/mobileApp/1464161396kapoor-watch-co.-ambi-gurg2.jpg',
            categoryType :'shopping-watch',
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