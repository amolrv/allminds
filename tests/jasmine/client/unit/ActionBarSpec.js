describe('actionbar.js', function () {

    beforeEach(function(){
        $.ajax({
            async: false // must be synchronous to guarantee that no tests are run before fixture is loaded

        });


    });
    it("should fetch images if user is logged in",function(){
        Meteor.loginWithGoogle();
            var imageResource = extractUserImage();
            expect(imageResource.length).toBe(1);

    });

    it("should mock Meteor.users.find()", function () {
        spyOn(Meteor.users,'find').and.callThrough();
        var image = extractUserImage();
        expect(Meteor.users.find).toHaveBeenCalled();

    });


});