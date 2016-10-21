var mapAccents={"â":"a","Â":"A","à":"a","À":"A","á":"a","Á":"A","ã":"a","Ã":"A","ê":"e","Ê":"E","è":"e","È":"E","é":"e","É":"E","î":"i","Î":"I","ì":"i","Ì":"I","í":"i","Í":"I","õ":"o","Õ":"O","ô":"o","Ô":"O","ò":"o","Ò":"O","ó":"o","Ó":"O","ö":"o","Ö":"O","ü":"u","Ü":"U","û":"u","Û":"U","ú":"u","Ú":"U","ù":"u","Ù":"U","ç":"c","Ç":"C"};

var removeAccents = function(value){
    return value.replace(/[\W\[\] ]/g,function(a){return mapAccents[a]||a})
};

var tagsWithSpace = function(value){
    return removeAccents(value).toLowerCase();
};

var tagsWithoutSpace = function(value){
    var regex = /[^a-z0-9]+/g;
    return tagsWithSpace(value).replace(regex, '');
};

var unescapeHtml = function(escaped) {
    return escaped
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, /"/)
        .replace(/&#039;/g, "'")
        .replace(/&apos;/g, "'");
};

var encode = function(str) {
    return str.replace(/[&\?= ]+/g,'+');
};

var getBytes = function(str) {
    var bytes = [], char;
    str = encodeURI(str);

    while (str.length) {
        char = str.slice(0, 1);
        str = str.slice(1);

        if ('%' !== char) {
            bytes.push(char.charCodeAt(0));
        } else {
            char = str.slice(0, 2);
            str = str.slice(2);

            bytes.push(parseInt(char, 16));
        }
    }

    return bytes;
};

module.exports.removeAccents = removeAccents;
module.exports.tagsWithSpace = tagsWithSpace;
module.exports.tagsWithoutSpace = tagsWithoutSpace;
module.exports.unescapeHtml = unescapeHtml;
module.exports.encode = encode;
module.exports.getBytes = getBytes;